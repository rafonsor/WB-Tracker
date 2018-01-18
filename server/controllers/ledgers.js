/**
 * Created by Hplus on 27/09/2015.
 */

var globals = require('../globals');
var fs = require('fs');

function rowToJson(row) {
    return {
        ledgerId: parseInt(row.id),
        ledgerHash: row.hash,
        previousLedgerId: parseInt(row.previous_id),
        previousLedgerHash: row.previous_hash,
        accountsHash: row.state_hash,
        transactionsRoot: row.root,
        opening: parseInt(row.open),
        closing: parseInt(row.close),
        numberOfAccounts: parseInt(row.number_accounts),
        numberOfTransactions: parseInt(row.number_transactions),
        amountInCirculation: parseInt(row.amount_circulation),
        amountTraded: parseInt(row.amount_traded),
        feesCollected: parseInt(row.fees),
        size: parseInt(row.size),
        relays: row.relays
    };
}

exports.validateLedger = function(req, res, next, ledger) {
    if(!isNaN(ledger)) {
        req.ledger = ledger;
        return next();
    }
    else if(globals.hashRegex.test(ledger)) {
        req.ledger = ledger;
        req.hash = true;
        return next();
    }

    return res.status(400).send({param: 'ledger', value: ledger, message: 'invalid Ledger identifier'});
};

exports.getLedgers = function(req, res) {
    var query = "SELECT * FROM ledgers ORDER BY ledger DESC LIMIT ";
    if(req.query.which && req.query.which === 'latest') query += "5";
    else {
        query += "25";
        if(req.query.offset && !isNaN(req.query.offset)) query += " OFFSET "+req.query.offset;
    }

    req.app.locals.database.Get(query, function(data) {
        if (!data) return res.sendStatus(500);
        else if (data.length == 0) return res.sendStatus(404);

        var ledgers = [];
        for (var i = 0; i < data.length; i++) ledgers.push(rowToJson(data[i]));
        return res.send({ledgers: ledgers});
    });
};

exports.getLedger = function(req, res) {
    var query = "SELECT * FROM ledgers WHERE ";
    if (req.hash) query += "hash = '"+req.ledger+"'";
    else query += "id = "+req.ledger;

    var data = req.app.locals.database.Get(query, function(data) {
        if (!data) return res.sendStatus(500);
        else if (data.length == 0) return res.sendStatus(404);

        return res.send({ledger: rowToJson(data[0])});
    });
};

exports.downloadLedger = function(req, res) {
    var query = "SELECT static_file FROM ledgers WHERE ";
    if(req.hash) query += "hash = '"+req.ledger+"'";
    else query += "id = "+req.ledger;

    var data = req.app.locals.database.Get(query, function(data) {
        if (!data) return res.sendStatus(500);
        else if (data.length == 0) return res.sendStatus(404);

        var stats = fs.statSync(data[0].static_file);

        if (stats.isFile()) return res.download(data[0].static_file, req.ledger + globals.ledgerExtension);
        return res.sendStatus(404);
    });
};