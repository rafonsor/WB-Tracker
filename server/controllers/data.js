/**
 * Created by Hplus on 27/09/2015.
 */

function rateToJson(row) {
    return {
        currency: row.currency,
        rate: parseFloat(row.rate),
        timestamp: row.timestamp
    };
}

exports.validateLanguage = function(req, res, next, language) {
    if(globals.languages.indexOf(language) != -1) {
        req.language = language;
    }
    else req.language = 'en';
    return next();
};

exports.validateToken = function(req, res, next, token) {
    if(globals.tokenRegex.test(token)) {
        req.token = token;
        return next();
    }

    return res.status(400).send({param: 'token', value: token, message: 'invalid token'});
};

exports.validateCurrency = function(req, res, next, currency) {
    if(globals.currencyRegex.test(currency)) {
        req.currency = currency;
        return next();
    }

    return res.status(400).send({param: 'currency', value: currency, message: 'invalid currency'});
};

exports.getLanguages = function (req, res) {
    req.app.locals.database.Get("select value from configurations where what = 'languages'", function(data) {

        if(!data) return res.sendStatus(500);
        else if(data.length == 0) return res.sendStatus(404);

        return res.send({languages: data[0].value.split(',')});
    });
};

exports.getTokens = function (req, res) {
    var query = "select token, "+req.language+" from tokens";

    req.app.locals.database.Get(query, function(data) {
        if (!data) return res.sendStatus(500);
        else if (data.length == 0) return res.sendStatus(404);

        var tokens = {};
        for (var i = 0; i < data.length; i++) tokens[data[i].token] = data[i][req.language];
        return res.send({tokens: tokens});
    });
};

exports.getToken = function (req, res) {
    var query = "select "+req.language+" from tokens where token = '"+req.token+"'";

    req.app.locals.database.Get(query, function(data) {
        if (!data) return res.sendStatus(500);
        else if (data.length == 0) return res.sendStatus(404);

        return res.send({token: data[0][req.language]});
    });
};

exports.getCurrencies = function (req, res) {
    req.app.locals.database.Get("select value from configurations where what = 'currencies'", function(data) {
        if (!data) return res.sendStatus(500);
        else if (data.length == 0) return res.sendStatus(404);

        return res.send({currencies: data[0].value.split(',')});
    });
};

exports.getRates = function (req, res) {
    req.app.locals.database.Get("select * from rates order by timestamp desc limit 10", function(data) {
        if (!data) return res.sendStatus(500);
        else if (data.length == 0) return res.sendStatus(404);

        var rates = [];
        for (var i = 0; i < data.length; i++) rates.push(rateToJson(data[i]));
        return res.send({rates: rates});
    });
};

exports.getRate = function (req, res) {
    var query = "select * from rates where currency = '"+req.currency+"'order by timestamp desc limit 1";

    req.app.locals.database.Get(query, function(data) {
        if (!data) return res.sendStatus(500);
        else if (data.length == 0) return res.sendStatus(404);

        return res.send({rates: rateToJson(data[0])});
    });
};