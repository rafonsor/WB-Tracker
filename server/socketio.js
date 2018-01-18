/**
 * Created by Hplus on 30/09/2015.
 */

module.exports = function(app, port) {
    var sio = require('socket.io')();

    sio.on('connection', function(socket) {
        var query = "SELECT hash, type, timestamp, exchanged FROM transactions ORDER BY timestamp DESC LIMIT 20";

        app.locals.database.Get(query, function(data) {
            if(data && data.length >0) socket.emit('latest', data);
        });
    });

    sio.on('reconnection', function(socket) {
        var query = "SELECT hash, type, timestamp, exchanged FROM transactions ORDER BY timestamp DESC LIMIT 20";

        app.locals.database.Get(query, function(data) {
            if(data && data.length >0) socket.emit('latest', data);
        });
    });

    sio.listen(port);
    return sio;
};