/**
 * Created by Hplus on 27/09/2015.
 */

var net = require('net');

var globals = require('../globals');
var controller = require('../network/controller');

exports.isWorldBank = function(req, res, next) {
    var credentials = req.get('Authorization');
    if(credentials && globals.wbCredentialsRegex.test(credentials)) {
        var id = credentials.substring(0, 14);
        var secret = credentials.substring(15);

        var query = "select count(*) as count from configurations where what = 'worldbank' and value = '" + credentials + "'";
        req.app.locals.database.Get(query, function(data) {

            if (!data || !data[0].count) return res.sendStatus(404);
            else return next();
        });
    }
    else return res.sendStatus(404);
};

exports.updateAuth = function(req, res) {
    if(req.body.auth && globals.wbCredentialsRegex.test(req.body.auth)) {
        var query = "update configurations set value = '" + req.body.auth + "' where what = 'worldbank'";

        req.app.locals.database.Execute(query, function(success) {
            if(success) return res.sendStatus(200);
            else return res.sendStatus(404);
        });
    }
    else return res.sendStatus(404);
};

exports.subscribe = function(req, res) {
    if(req.body.port && globals.portRegex.test(req.body.port) && req.body.name && globals.nameRegex.test(req.body.name)) {
        var query = "INSERT INTO publishers VALUES('"+req.node+"', "+req.body.port+", '"+req.body.name+"', ";
        var transaction = false, ledger = false, block = false;
        if(req.body.transaction) transaction = true;
        if(req.body.ledger) ledger = true;
        if(req.body.block) block = true;
        query += transaction+", "+ledger+", "+block+", default)";

        req.app.locals.database.Execute(query, function(success) {
            if(!success) return res.sendStatus(500);

            //Send subscription message to the Validating Node
            var message = "{'name':'"+data.name+"', transaction: "+transaction+", ledger: "+ledger+", networkManagementBlock: "+block+"}";
            message = globals.NETWORK_SUBSCRIBE + '' + message.length + message;

            if(SendMessageToNode(data.host, message)) {
                //Start listening to this new publisher
                app.publishers[req.node] = require('./server/network/tcp')(app, req.node, req.port, controller.PublisherHandler);
                return res.sendStatus(200);
            }
            else return res.sendStatus(500);
        });
    }
    else return res.sendStatus(400);
};

exports.updateSubscriptions = function(req, res) {
    var query = "UPDATE publishers SET ";
    var transaction = false, ledger = false, block = false;
    if(req.body.transaction) transaction = true;
    if(req.body.ledger) ledger = true;
    if(req.body.block) block = true;
    query += "transaction = "+transaction+", ledger = "+ledger+", block = "+block+" WHERE node = '"+req.node+"'";

    req.app.locals.database.Execute(query, function(success) {
        if(!success) return res.sendStatus(500);

        //Retrieve host and name used for the subscription
        query = "SELECT nodes.host as host, publisher.name as name FROM nodes JOIN publishers ON nodes.id = publishers.node WHERE publishers.node = '"+req.node+"'";
        req.app.locals.database.Get(query, function(data) {
            if(data && data.length > 0) {
                //Contact the Validating Node to update the subscriptions
                var message = "{'name':'"+data.name+"', transaction: "+transaction+", ledger: "+ledger+", networkManagementBlock: "+block+"}";
                message = globals.NETWORK_SUBSCRIPTIONS + '' + message.length + message;

                if(SendMessageToNode(data.host, message)) return res.sendStatus(200);
                else return res.sendStatus(500);
            }
        });
    });
};

exports.unsubscribe = function(req, res) {
    //Stop listening to this Validating Node
    if(app.publishers[req.node]) app.publishers[req.node].close();

    var query = "UPDATE publishers SET status = 'inactive' WHERE node = '"+req.node+"'";
    req.app.locals.database.Execute(query, function(success) {
        if(!success) return res.sendStatus(500);

        //Retrieve host and name used for the subscription
        query = "SELECT nodes.host as host, publisher.name as name FROM nodes JOIN publishers ON nodes.id = publishers.node WHERE publishers.node = '"+req.node+"'";

        req.app.locals.database.Get(query, function(data) {
            if(data && data.length > 0) {
                //Contact the Validating Node to cancel the subscriptions
                var message = "{'name':'"+data.name+"'}";
                message = globals.NETWORK_UNSUBSCRIBE + '' + message.length + message;

                if(SendMessageToNode(data.host, message)) return res.sendStatus(200);
                else return res.sendStatus(500);
            }
        });
    });
};

function SendMessageToNode(host, message) {
    //Connect to the Node
    var separator = host.indexOf(':');
    const socket = net.createConnection({host: host.substr(0,separator), port: parseInt(host.substr(separator+1, 5))});
    socket.on('connect', function() {
        //Send the message
        socket.write(message);
        socket.end();
        return true;
    });
    socket.on('timeout', function() {
        socket.end();
        return false;
    });
    socket.on('error', function() {
        socket.end();
        return false;
    });
}