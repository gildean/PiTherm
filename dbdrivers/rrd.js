'use strict';
var rrd = require('node_rrd');
var fs = require('fs');
var async = require('async');
var now = function () { return Math.ceil(Date.now() / 1000); };
var filename, rras;
module.exports = {

    init: function (config, callback) {
        var self = this;
        var dss = config.dss;
        rras = config.rra;
        var rraKeys = Object.keys(rras);
        filename = config.filename;
        var exists = fs.existsSync(filename);
        var ds, rraArr;
        if (!exists) {
            ds = [];
            rraArr = [];
            Object.keys(dss).forEach(function (name) {
                dss[name].name = name;
                var d = new rrd.DS(dss[name]);
                ds.push(d);
            });
            rraKeys.forEach(function (rra) {
                var a = new rrd.RRA(rras[rra]);
                rraArr.push(a);
            });
            var options = {
                step: 60,
                time: now(),
                ds:  ds,
                rra: rraArr
            };
            rrd.create(filename, options, function (err) {
                if (!err) {
                    callback(null);
                } else {
                    callback(err);
                }
            });
        } else {
            callback(null);
        }
    },

    update: function (data, callback) {
        var templates = [];
        var nowS = now();
        var values = nowS.toString();
        data.forEach(function (datalet) {
            templates.push(datalet.name);
            values +=  ':' + datalet.temp;
        });
        rrd.update(filename, templates.join(':'), [values], function (err) {
            if (!err) {
                callback(null);
            } else {
                callback(err);
            }
        });
    },

    fetch: function (data, callback) {
        var set = rras[data];
        var rows = set.rows;
        var sec = set.steps;
        var reso = sec * 60;
        var minuteAgo = Date.now() / 1000;
        var nowStart = parseInt((minuteAgo - (reso * rows)) / reso) * reso;
        var nowEnd = parseInt(minuteAgo / reso) * reso;
        var result = [];
        rrd.fetch(filename, { cf: set.cf, start: nowStart, end: nowEnd, resolution: reso }, function (time, datas) {
            if (time !== null) {
                result.push({ sensors: datas, time: time * 1000 });
            } else {
                result.pop();
                callback(null, result);
            }
        });
    }

};
