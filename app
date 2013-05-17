#!/usr/bin/env node
'use strict';
var http = require('http'),
    async = require('async'),
    config = require('./config'),
    routes = require('./routes'),
    requestHandler = require('./httpserver'),
    wsserver = require('./websocketserver'),
    sensors = require('./sensors/temperature'),
    refreshrate = config.refreshrate || 30000,
    dbdriver = require('./dbdrivers/' + config.db.name),
    graphHistory = [],
    info = 'TEMPDATA',
    history = 'HISTORY',
    intervals = {
        'HOUR': '',
        'DAY': '',
        'MONTH': ''
    },
    wss;

var sensorReader = {
    quit: function (err) {
        console.log(err);
        process.exit(1);
    },
    readInterval: function () {
        var self = this;
        sensors.readSensors(function (err, results) {
            if (!err) {
                dbdriver.update(results, function (err) {
                    if (err) {
                        console.log(err);
                    }
                });
                var data = {
                    type: info,
                    time: Date.now(),
                    sensors: {}
                };
                results.forEach(function (datalet) {
                    data.sensors[datalet.name] = {
                        temp: datalet.temp,
                        high: datalet.high,
                        low: datalet.low
                    };
                });
                graphHistory.data.shift();
                graphHistory.data.push(data);
                self.wss.emit('sendToAll',JSON.stringify(data));
                setTimeout(self.readInterval.bind(sensorReader), refreshrate);
            } else {
                self.quit(err);
            }
        });
    },
    wss: {},
    init: function (wss, callback) {
        var self = this;
        this.wss = wss;
        this.wss.on('message', function (message, id) {
            var sending;
            if (message === history) {
                sending = graphHistory.data;
                this.emit('sendToOne', JSON.stringify({ type: history, data: sending }), id);
            } else if (intervals.hasOwnProperty(message)) {
                dbdriver.fetch(message, function (err, result) {
                    self.wss.emit('sendToOne', JSON.stringify({ type: message, data: result }), id);
                });
            }
        });
        callback(null);
    }
};

var graphHistory = {
    data: [],
    init: function (tempdata, callback) {
        var now =  Date.now() - 120000;
        for (var i = 0; i < 120; i += 1) {
            var data = {
                type: info,
                time: now + (i * 1000),
                sensors: tempdata
            };
            graphHistory.data.push(data);
        }
        callback(null, config.db.config);
    }
};

(function startChecking() {
    async.waterfall([
        sensors.init,
        graphHistory.init,
        dbdriver.init,
        routes.init,
        requestHandler.init,
        wsserver.init,
        sensorReader.init.bind(sensorReader)
    ], function (err) {
        if (!err) {
            sensorReader.readInterval();
        } else {
            sensorReader.quit(err);
        }
    });
}());
