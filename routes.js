'use strict';
var fs = require('fs'),
    async = require('async'),
    zlib = require('zlib'),
    async = require('async'),
    config = require('./config'),
    appName = '<title>' + config.name + '</title>',
    nameHeader = '<h1 class="logo">' + config.name + '</h1>',
    extScriptFile = fs.readFileSync('./public/js/external.js').toString('utf8'),
    scriptFile = fs.readFileSync('./public/js/script.js').toString('utf8'),
    styleFile = fs.readFileSync('./public/css/style.css').toString('utf8'),
    themeStyleFile = fs.readFileSync('./public/css/' + config.theme + '.css').toString('utf8'),
    htmlFile = fs.readFileSync('./public/index.html').toString('utf8'),
    faviconFile = fs.readFileSync('./public/favicon.ico'),
    touchFile = fs.readFileSync('./public/apple-touch-icon.png'),
    styles = '\n<style>\n' + styleFile + '\n' + themeStyleFile + '\n</style>\n</head>',
    scripts = extScriptFile + scriptFile,
    htmls = htmlFile.replace('<title></title>', appName).replace('<h1></h1>', nameHeader).replace('</head>', styles),
    routes = {
        '/': {
            file: htmls,
            type: 'text/html'
        },
        '/js/script.js': {
            file: scripts,
            type: 'application/javascript'
        },
        '/favicon.ico': {
            file: faviconFile,
            type: 'image/x-icon'
        },
        '/apple-touch-icon.png': {
            file: touchFile,
            type: 'image/png'
        },
        '/apple-touch-icon-precomposed.png': {
            file: touchFile,
            type: 'image/png'
        }

    };

exports.init = function (callbck) {
    var routeArr = Object.keys(routes);
    async.each(routeArr, saveFile, function (err) {
        if (!err) {
            callbck(null, routes);
        } else {
            callbck(err, null);
        }
    });
    function saveFile(route, callback) {
        var curRoute = routes[route];
        var file = curRoute.file;
        async.parallel([
            function (cb) {
                zlib.gzip(file, function (err, gzipped) {
                    if (!err) {
                        curRoute.gzip = gzipped;
                        cb(null);
                    } else {
                        cb(err);
                    }
                });
            },
            function (cb) {
                zlib.deflate(file, function (err, deflated) {
                    if (!err) {
                        curRoute.deflated =  deflated;
                        cb(null);
                    } else {
                        cb(err);
                    }
                });
            },
            function (cb) {
                if (route === '/apple-touch-icon-precomposed.png') {
                    route = '/apple-touch-icon.png';
                }
                fs.stat('./public' + route, function (err, stats) {
                    if (!err) {
                        curRoute.mtime = stats.mtime;
                        curRoute.etag = stats.size + '-' + Date.parse(stats.mtime);
                        cb(null);
                    } else {
                        cb(err);
                    }
                });
            }
        ], function (err) {
            if (!err) {
                callback(null);
            } else {
                callback(err);
            }
        });
    }
};
