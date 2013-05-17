'use strict';
var async = require('async'),
    fs = require('fs'),
    config = require('../config'),
    sensors = config.sensors.temperature,
    sensorNames = Object.keys(sensors),
    sensorPaths = [],
    sensorLookup = {},
    hilow = {};

// creating the sensorname lookup tables and priming some data
(function setSensorLookups() {
    sensorNames.forEach(function (name) {
        var sensorNamePath = sensors[name];
        hilow[name] = {
            name: name,
            high: 0,
            low: 60,
            temp: 20
        };
        sensorPaths.push(sensorNamePath);
        sensorLookup[sensorNamePath] = name;
    });
}());

// init function checks that all the sensors exist and then gets a sample of the data
exports.init = function init(callback) {
    async.every(sensorPaths, fs.exists, function (exists) {
        if (exists) {
            readSensors(function (err, data) {
                if (!err) {
                    callback(null, data);
                } else {
                    callback(err, null);
                }
            });
        } else {
            callback(new Error('Check set sensorpaths in config.json'), null);
        }
    });
};

// a mapping function to gather the data from all the sensors in parallel
var readSensors = exports.readSensors = function readSensors(callback) {
    async.map(sensorPaths, reading, function (err, results) {
        if (!err) {
            callback(null, results);
        } else {
            callback(err, null);
        }
    });
};

var reading = function reading(path, callback) {
    fs.readFile(path, function (err, data) {
        if (!err) {
            var splitted = data.toString().split('\n');
            var valid = (splitted[0].indexOf('YES') !== -1);
            var tempStr = splitted[1];
            var sensorName = sensorLookup[path];
            var readSensor = hilow[sensorName];
            var temperature = (valid) ? (parseInt(tempStr.substring(tempStr.indexOf('=') + 1)) / 1000) : readSensor.temp;
            readSensor.temp = temperature;
            if (readSensor.high < temperature) {
                readSensor.high = temperature;
            }
            if (readSensor.low > temperature) {
                readSensor.low = temperature;
            }
            var result = readSensor;
            callback(null, result);
        } else {
            callback(err, null);
        }
    });
};
