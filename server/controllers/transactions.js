/**
 * Created by Hplus on 26/09/2015.
 */

var globals = require('../globals');

function rowToJson(row) {
    return {
        hash: row.hash,
        type: row.type,
        timestamp: row.timestamp,
        ledger: row.ledger,
        raw: row.raw,
        size: row.size,
        relays: row.relays
    };
}

exports.validateHash = function(req, res, next, hash) {
    if(globals.hashRegex.test(hash)) {
        req.hash = hash.toUpperCase();
        return next();
    }

    return res.status(400).send({param: 'hash', value: hash, message: 'invalid transaction hash'});
};

exports.getTransaction = function(req, res) {
    var query = "SELECT * FROM transactions WHERE hash = '"+req.hash+"'";

    req.app.locals.database.Get(query, function(data) {
        if (!data) return res.sendStatus(500);
        else if (data.length == 0) return res.sendStatus(404);

        return res.send({transaction: rowToJson(data[0])});
    });
};

exports.getLedgerTransactions = function(req, res, next) {
    req.sql = "SELECT * FROM transactions WHERE ledger = '"+req.ledger+"' ORDER BY timestamp ASC LIMIT 100";

    //Add an offset if applicable
    if(req.query.offset && !isNaN(req.query.offset)) req.sql += " OFFSET "+req.query.offset;

    next();
};

exports.getAccountTransactions = function(req, res, next) {
    req.sql = "SELECT * FROM transactions JOIN accounts_transactions ON (transactions.hash = account_transactions.transaction)" +
        " WHERE account_transactions.account = '"+req.account+"' ORDER BY timestamp DESC LIMIT 100";

    //Add an offset if applicable
    if(req.query.offset && !isNaN(req.query.offset)) req.sql += " OFFSET "+req.query.offset;

    next();
};

exports.getLatestTransactions = function(req, res, next) {
    req.sql = "SELECT * FROM transactions";
    var constraint = false;

    //Add a type constraint if requested
    if(req.query.type && globals.transactionTypes.indexOf(req.query.type) != -1) {
        res.sql += "WHERE type = (SELECT type FROM transaction_types WHERE designation = '"+req.query.type+"')";
        constraint = true;
    }

    //Add a time constraint if applicable
    if(req.query.start && globals.timestampRegex.test(req.query.start)) {
        if(constraint) req.sql += " AND";
        else req.sql += " WHERE";
        res.sql += " timestamp <= "+req.query.start;
    }
    req.sql += " ORDER BY timestamp DESC LIMIT 100";

    //Add an offset if applicable
    if(req.query.offset && !isNaN(req.query.offset)) req.sql += " OFFSET "+req.query.offset;

    next();
};

exports.getDAOTransactions = function(req, res, next) {
    req.sql = "SELECT * FROM transactions WHERE type = (SELECT type FROM transaction_types WHERE designation = 'DAO')" +
        " AND data::json->>'DAO' = '"+req.dao+"' ORDER BY timestamp DESC LIMIT 100";

    //Add an offset if applicable
    if(req.query.offset && !isNaN(req.query.offset)) req.sql += " OFFSET "+req.query.offset;

    next();
};

exports.getDASTransactions = function(req, res, next) {
    req.sql = "SELECT * FROM transactions WHERE type = (SELECT type FROM transaction_types WHERE designation = 'DAS')" +
        " AND data::json->>'DAS' = '"+req.das+"' ORDER BY timestamp DESC LIMIT 100";

    //Add an offset if applicable
    if(req.query.offset && !isNaN(req.query.offset)) req.sql += " OFFSET "+req.query.offset;

    next();
};

exports.getTransactions = function(req, res) {
    req.app.locals.database.Get(req.sql, function(data) {
        if (!data) return res.sendStatus(500);
        else if (data.length == 0) return res.sendStatus(404);

        var transactions = [];
        for (var i = 0; i < data.length; i++) transactions.push(rowToJson(data[i]));
        return res.send({transactions: transactions});
    });
};