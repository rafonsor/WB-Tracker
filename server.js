/**
 * Created by Hplus on 26/09/2015.
 */

var bodyParser = require('body-parser');
var http = require('http');
var https = require('https');
var fs = require('fs');
var express = require('express');
var app = express();

var globals = require('./server/globals');
app.locals.database = require('./server/database').db;
app.locals.sio = require('./server/socketio')(app, 8100);

app.locals.ledger = {};
app.locals.ledger.id = Math.ceil((new Date()-globals.genesisClose)/globals.ledgerDuration);
app.locals.ledger.close = globals.genesisClose + globals.ledgerDuration * app.locals.ledger.id;
app.locals.receivingLedger = {};
app.locals.receivingBlock = {};

app.set('views','./public/views');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use(express.static('./public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.disable('x-powered-by');
/*
 var tlsOptions = {
 key: fs.readFileSync('./server/config/tracker_server.key'),
 cert: fs.readFileSync('./server/config/tracker_server.crt'),
 ciphers: 'TLSv1.2,!aNULL,!eNULL',
 honorCipherOrder: true
 };*/

var accRoutes = require('./server/routes/accounts').router;
var nmbRoutes = require('./server/routes/blockchain').router;
var dataRoutes = require('./server/routes/data').router;
var ledRoutes = require('./server/routes/ledgers').router;
var resRoutes = require('./server/routes/resources').router;
var txRoutes = require('./server/routes/transactions').router;
var wbRoutes = require('./server/routes/wb').router;

app.get('views/:view', function(req, res) {
    res.render('/'+req.params.view);
});
app.get('/views/:view', function(req, res) {
    res.render('/'+req.params.view);
});

app.use('/api', accRoutes);
app.use('/api', nmbRoutes);
app.use('/api', dataRoutes);
app.use('/api', ledRoutes);
app.use('/api', resRoutes);
app.use('/api', txRoutes);

app.get('/*', function(req, res) {
    res.render('index');
});
http.createServer(app).listen(8000, function() {
    console.log('Server listening to port 8000!');
});

app.use('/api', wbRoutes);

//https.createServer(tlsOptions, app).listen(443);

var controller = require('./server/network/controller');
var updatesTcp = require('./server/network/tcp')(app, 5000, controller.UpdatesHandler);

//Start Listening to all subscribed Validating Nodes
app.publishers = {};
var query = "SELECT node, port FROM publishers WHERE status != 'inactive'";
app.locals.database.Get(query, function(data) {
    if(data) for(var i = 0; i < data.length; i++) {
        app.publishers[data[i].node] = require('./server/network/tcp')(app, data[i].node, data[i].port, controller.PublisherHandler);
    }
});