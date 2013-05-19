'use strict';
var url = require('url'),
    http = require('http'),
    config = require('./config'),
    routes = require('./routes'),
    coffee = 'Out of coffee...',
    PORT = config.port || 30000,
    headers = function (mtime) {
        return {
            'Cache-Control': 'public, max-age=31536000',
            'X-Powered-By':'raspberry Pi',
            'Last-Modified': mtime,
            'Expires': 'Wed, 01 Jan 2020 16:20:00 GMT'
        };
    },
    server = http.createServer(app),
    routed;

function app(req, res) {
    if (routed.hasOwnProperty(req.url)) {
        var resFile = routed[req.url];
        var reqHeaders = req.headers;
        var resHeaders = headers(resFile.mtime);
        if (reqHeaders['if-none-match'] === resFile.etag) {
            res.writeHead(304, resHeaders);
            return res.end();
        }
        var acceptEncoding = reqHeaders['accept-encoding'];
        resHeaders['ETag'] = resFile.etag;
        resHeaders['Content-Type'] = resFile.type;
        if (acceptEncoding) {
            var gzipd = acceptEncoding.match(/\bgzip|deflate\b/);
            if (gzipd) {
                resHeaders['content-encoding'] = gzipd[0];
                res.writeHead(200, resHeaders);
                return res.end(resFile[gzipd[0]]);
            }
        }
        res.writeHead(200, resHeaders);
        return res.end(resFile.file);
    } else {
        res.statusCode = 418;
        return res.end(coffee);
    }
}

module.exports = {
    init: function (routes, callback) {
        routed = routes;
        server.listen(PORT);
        callback(null, server);
    }
};
