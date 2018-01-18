/**
 * Created by Hplus on 26/09/2015.
 */

var globals = require('../globals');


function rowToJson(row) {
    var account = {};
    account[row.account] = {
        public_key: row.public_key,
        balance: parseInt(row.balance),
        ledger: parseInt(row.ledger),
        updated: parseInt(row.last_update)
    };

    return account;
}

exports.validateAccount = function(req, res, next, account) {
    if(globals.accountRegex.test(account)) {
        req.account = account.toUpperCase();
        return next();
    }

    return res.status(400).send({param: 'account', value: account, message: 'invalid account'});
};

exports.getAccount = function(req, res) {
    var query = "SELECT accounts.account, accounts.public_key, balances.balance, balances.ledger, balances.last_update FROM balances " +
        "JOIN accounts ON (balances.account = accounts.account) WHERE accounts.account = '"+req.account+"' ORDER BY ledger DESC LIMIT 1";

    req.app.locals.database.Get(query, function(data) {
        if (!data) return res.sendStatus(500);
        else if (data.length == 0) return res.sendStatus(404);

        var account = rowToJson(data[0]);
        return res.send(account);
    });
};

exports.getLedgerAccounts = function(req, res) {
    var query = "SELECT account, balance FROM balances WHERE ledger = '"+req.ledger+"' ORDER BY account ASC LIMIT 100";

    //Add an offset if applicable
    if(req.query.offset && !isNaN(req.query.offset)) req.sql += " OFFSET "+req.query.offset;

    req.app.locals.database.Get(query, function(data) {
        if (!data) return res.sendStatus(500);
        else if (data.length == 0) return res.sendStatus(404);

        var accounts = {};
        for (var i = 0; i < data.length; i++) accounts[data[i].account] = data[i].balance;
        return res.send({accounts: accounts});
    });
};

exports.getSlotAccounts = function(req, res) {
    var query = "SELECT account FROM accounts WHERE account >= '"+req.slot+"000000' AND account <= '"+req.slot+"999999' ORDER BY account ASC LIMIT 500";

    //Add an offset if applicable
    if(req.query.offset && !isNaN(req.query.offset)) req.sql += " OFFSET "+req.query.offset;

    req.app.locals.database.Get(query, function(data) {
        if (!data) return res.sendStatus(500);
        else if (data.length == 0) return res.sendStatus(404);

        var accounts = [];
        for (var i = 0; i < data.length; i++) accounts.push(data[i].account);
        return res.send({accounts: accounts});
    });
};

exports.newAccount = function(req, res) {
    if(req.body.account && globals.accountRegex.test(req.body.account) && req.body.public_key && globals.keyRegex.test(req.body.public_key)) {
        var query = "INSERT INTO accounts(account, public_key) VALUES('"+req.body.account+"','"+req.body.public_key+"')";

        req.app.locals.database.Execute(query, function(success) {
            if(success) return res.sendStatus(200);
            return res.sendStatus(404);
        });
    }
    else return res.sendStatus(404);
};