'use strict';
var WebSocketServer = require('websocket').server,
    connIds = [];

module.exports = {
    init: function (server, callback) {
        var wss = new WebSocketServer({ httpServer: server });
        wss.clientConnections = {};
        wss.on('request', function (request) {
            var connection = request.accept(null, request.remoteAddress);
            var cid = request.key;
            var self = this;
            connection.id = cid;
            this.clientConnections[cid] = connection;
            connIds.push(cid);
            connection.on('message', function (message) {
                if (message.type === 'utf8') {
                    self.emit('message', message.utf8Data, cid);
                }
            })
            .on('error', function (error) {
                connection.close();
            })
            .on('close', function () {
                delete self.clientConnections[connection.id];
                connIds = Object.keys(self.clientConnections);
            });

        })
        .on('sendToOne', function (data, id) {
            if (this.clientConnections.hasOwnProperty(id) && this.clientConnections[id].connected) {
                this.clientConnections[id].send(data);
            }
        })
        .on('sendToAll', function (data) {
            var self = this;
            connIds.forEach(function (conn) {
                var connected = self.clientConnections[conn];
                if (connected.connected) {
                    connected.send(data);
                }
            });
        });
        callback(null, wss);
    }
};
