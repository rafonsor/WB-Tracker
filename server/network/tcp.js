/**
 * Created by Hplus on 27/09/2015.
 */

var net = require('net');

module.exports = function(app, nodeId, port, handler) {
    var server = net.createServer(function (socket) {

        socket.on('data', function (data) {
            if(!handler(app, nodeId, socket, data)) {
                socket.destroy();
                socket.end();
            }
        });

        socket.on('error', function (data) {
            socket.destroy();
            socket.end();
        });

        socket.on('end', function () {
            socket.destroy();
            socket.end();
        });

    });

    server.listen(port, function () {
        console.log('TCP Server bound');
    });

    return server;
};