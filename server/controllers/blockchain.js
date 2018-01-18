/**
 * Created by hplus on 07/08/2016.
 */

var globals = require('../globals');
var fs = require('fs');

function blockToJson(row) {
    return {
        blockId: parseInt(row.id),
        blockHash: row.hash,
        previousBlockHash: row.previous_hash,
        date: parseInt(row.close),
        entriesRoot: row.root,
        numberOfEntries: parseInt(row.number_entries),
        entries: row.entries,
        size: parseInt(row.size),
        relays: row.relays
    };
}

function entrySummaryToJson(row) {
    return {
        entry: row.hash,
        resource: row.resource,
        type: row.type,
        date: row.creation
    };
}

function entryToJson(row) {
    return {
        hash: row.hash,
        raw: row.raw,
        blockId: parseInt(row.block),
        size: parseInt(row.creation)
    };
}

exports.validateBlock = function(req, res, next, block) {
    if(!isNaN(block)) {
        req.block = block;
        return next();
    }
    else if(globals.hashRegex.test(block)) {
        req.block = block;
        req.hash = true;
        return next();
    }

    return res.status(400).send({param: 'block', value: block, message: 'invalid Network Management Block identifier'});
};

exports.validateEntry = function(req, res, next, entry) {
    if(globals.hashRegex.test(entry)) {
        req.entry = entry;
        req.hash = true;
        return next();
    }

    return res.status(400).send({param: 'entry', value: entry, message: 'invalid Network Management Entry hash'});
};

exports.getBlocks = function(req, res) {
    var query = "SELECT * FROM blocks ORDER BY block DESC LIMIT ";
    if(req.query.which && req.query.which === 'latest') query += "5";
    else {
        query += "25";
        if(req.query.offset && !isNaN(req.query.offset)) query += " OFFSET "+req.query.offset;
    }

    req.app.locals.database.Get(query, function(data) {
        if (!data) return res.sendStatus(500);
        else if (data.length == 0) return res.sendStatus(404);

        var blocks = [];
        for (var i = 0; i < data.length; i++) blocks.push(blockToJson(data[i]));
        return res.send({blocks: blocks});
    });
};

exports.getBlock = function(req, res) {
    var query = "SELECT * FROM blocks WHERE ";
    if (req.hash) query += "hash = '"+req.block+"'";
    else query += "id = "+req.block;

    var data = req.app.locals.database.Get(query, function(data) {
        if (!data) return res.sendStatus(500);
        else if (data.length == 0) return res.sendStatus(404);

        return res.send({block: blockToJson(data[0])});
    });
};

exports.getBlockEntries = function(req, res) {
    var query = "SELECT hash, resource, type, creation FROM entries WHERE hash in (SELECT entries FROM blocks WHERE ";
    if (req.hash) query += "hash = '"+req.block+"'";
    else query += "id = "+req.block;

    query += ") ORDER BY creation ASC LIMIT 100";

    //Add an offset if applicable
    if(req.query.offset && !isNaN(req.query.offset)) req.sql += " OFFSET "+req.query.offset;

    var data = req.app.locals.database.Get(query, function(data) {
        if (!data) return res.sendStatus(500);
        else if (data.length == 0) return res.sendStatus(404);

        var entries = [];
        for (var i = 0; i < data.length; i++) entries.push(entrySummaryToJson(data[i]));
        return res.send({entries: entries});
    });
};

exports.downloadBlock = function(req, res) {
    var query = "SELECT static_file FROM blocks WHERE ";
    if(req.hash) query += "hash = '"+req.block+"'";
    else query += "id = "+req.block;

    var data = req.app.locals.database.Get(query, function(data) {
        if (!data) return res.sendStatus(500);
        else if (data.length == 0) return res.sendStatus(404);

        var stats = fs.statSync(data[0].static_file);

        if (stats.isFile()) return res.download(data[0].static_file, req.block + globals.blockExtension);
        return res.sendStatus(404);
    });
};

exports.getEntry = function(req, res) {
    var query = "SELECT hash, raw, block, size FROM entries WHERE hash = '"+req.entry+"'";

    var data = req.app.locals.database.Get(query, function(data) {
        if (!data) return res.sendStatus(500);
        else if (data.length == 0) return res.sendStatus(404);

        return res.send({entry: entryToJson(data[0])});
    });
};

exports.getPassportEntries = function(req, res) {
    var query = "SELECT hash, resource, type, creation FROM entries WHERE signer = '"+req.passport+"' ORDER BY creation DESC LIMIT 50";

    //Add an offset if applicable
    if(req.query.offset && !isNaN(req.query.offset)) req.sql += " OFFSET "+req.query.offset;

    var data = req.app.locals.database.Get(query, function(data) {
        if (!data) return res.sendStatus(500);
        else if (data.length == 0) return res.sendStatus(404);

        var entries = [];
        for (var i = 0; i < data.length; i++) entries.push(entrySummaryToJson(data[i]));
        return res.send({entries: entries});
    });
};

exports.getEntityEntries = function(req, res) {
    var query = "SELECT hash, resource, type, creation FROM entries WHERE signer = '"+req.entity+"' ORDER BY creation DESC LIMIT 50";

    //Add an offset if applicable
    if(req.query.offset && !isNaN(req.query.offset)) req.sql += " OFFSET "+req.query.offset;

    var data = req.app.locals.database.Get(query, function(data) {
        if (!data) return res.sendStatus(500);
        else if (data.length == 0) return res.sendStatus(404);

        var entries = [];
        for (var i = 0; i < data.length; i++) entries.push(entrySummaryToJson(data[i]));
        return res.send({entries: entries});
    });
};

exports.getResourceEntries = function(req, res) {
    var query = "SELECT hash, signer, type, creation FROM entries WHERE type = 'RESOURCE' AND data->>'designation' = '"+req.resource+"' ORDER BY creation DESC LIMIT 50";

    //Add an offset if applicable
    if(req.query.offset && !isNaN(req.query.offset)) req.sql += " OFFSET "+req.query.offset;

    var data = req.app.locals.database.Get(query, function(data) {
        if (!data) return res.sendStatus(500);
        else if (data.length == 0) return res.sendStatus(404);

        var entries = [];
        for (var i = 0; i < data.length; i++) entries.push({
            entry: data[i].hash,
            resource: data[i].resource,
            type: data[i].type,
            date: data[i].creation
        });
        return res.send({entries: entries});
    });
};