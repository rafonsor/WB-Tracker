/**
 * Created by hplus on 07/08/2016.
 */

var globals = require('../globals');

function slotToJson(row) {
    return {
        slot: row.slot,
        entity: row.entity,
        accounts: row.accounts,
        updated: row.last_updated
    };
}

function passportToJson(row) {
    return {
        passport: row.passport,
        designation: row.designation,
        company: row.company,
        website: row.website,
        certificate: row.certificate,
        public_key: row.public_key,
        representative: row.representative,
        email: row.email,
        contact: row.contact,
        country: row.country,
        account: row.account,
        updated: parseInt(row.last_update),
        status: row.status
    };
}

function entityToJson(row) {
    return {
        node: row.id,
        public_key: row.public_key,
        host: row.host,
        account: row.account,
        passport: row.passport,
        updated: parseInt(row.last_update),
        status: row.status
    };
}

function nodeToJson(row) {
    return {
        node: row.id,
        public_key: row.public_key,
        host: row.host,
        account: row.account,
        networkVersion: row.version,
        passport: row.passport,
        updated: parseInt(row.last_update),
        status: row.status
    };
}

function daoToJson(row) {
    return {
        dao: row.dao,
        designation: row.designation,
        supervisor: row.supervisor,
        documentation: row.documentation,
        account: row.account,
        networkVersion: row.version,
        updated: parseInt(row.last_update),
        status: row.status
    };
}

function dasToJson(row) {
    return {
        das: row.das,
        designation: row.designation,
        manager: row.manager,
        documentation: row.documentation,
        account: row.account,
        networkVersion: row.version,
        updated: parseInt(row.last_update),
        status: row.status
    };
}

function resourceToJson(row) {
    return {
        resource: row.resource,
        supervisor: row.supervisor,
        protection: row.protection,
        identifiers: row.identifiers,
        operations: row.operations,
        updated: parseInt(row.last_update),
        status: row.status
    };
}

exports.validateSlot = function(req, res, next, slot) {
    if(globals.slotRegex.test(slot)) {
        req.slot = slot.toUpperCase();
        return next();
    }
    return res.status(400).send({param: 'slot', value: slot, message: 'invalid Slot number'});
};

exports.validatePassport = function(req, res, next, passport) {
    if(globals.passportRegex.test(passport)) {
        req.passport = passport.toUpperCase();
        return next();
    }
    return res.status(400).send({param: 'passport', value: passport, message: 'invalid Passport ID'});
};

exports.validateEntity = function(req, res, next, entity) {
    if(globals.entityRegex.test(entity)) {
        req.entity = entity.toUpperCase();
        return next();
    }
    return res.status(400).send({param: 'entity', value: entity, message: 'invalid Managing Entity ID'});
};

exports.validateNode = function(req, res, next, node) {
    if(globals.nodeRegex.test(node)) {
        req.node = node.toUpperCase();
        return next();
    }
    return res.status(400).send({param: 'node', value: node, message: 'invalid Validating Node ID'});
};

exports.validateDAO = function(req, res, next, dao) {
    if(globals.daoRegex.test(dao)) {
        req.dao = dao.toUpperCase();
        return next();
    }
    return res.status(400).send({param: 'dao', value: dao, message: 'invalid DAO ID'});
};

exports.validateDAS = function(req, res, next, das) {
    if(globals.dasRegex.test(das)) {
        req.das = das.toUpperCase();
        return next();
    }
    return res.status(400).send({param: 'das', value: das, message: 'invalid DAS ID'});
};

exports.validateResource = function(req, res, next, resource) {
    if(globals.resourceRegex.test(resource)) {
        req.resource = resource.toUpperCase();
        return next();
    }
    return res.status(400).send({param: 'resource', value: resource, message: 'invalid Network Management Blockchain resource'});
};

exports.getSlots = function(req, res) {
    var query = "SELECT * FROM slots WHERE status != 'inactive' ORDER BY ";

    //Set ordering
    if(req.query.order && req.query.order == 'size') query += "accounts DESC";
    else query += "slot ASC";
    query += " LIMIT 500";

    //Add an offset if applicable
    if(req.query.offset && !isNaN(req.query.offset)) req.sql += " OFFSET "+req.query.offset;

    req.app.locals.database.Get(query, function(data) {
        if (!data) return res.sendStatus(500);
        else if (data.length == 0) return res.sendStatus(404);

        var slots = [];
        for (var i = 0; i < data.length; i++) slots.push(slotToJson(data[i]));
        return res.send({slots: slots});
    });
};

exports.getSlot = function(req, res) {
    var query = "SELECT * FROM slots WHERE slot = '"+req.slot+"'";

    req.app.locals.database.Get(query, function(data) {
        if (!data) return res.sendStatus(500);
        else if (data.length == 0) return res.sendStatus(404);

        return res.send(slotToJson(data[0]));
    });
};

exports.getPassports = function(req, res) {
    var query = "SELECT * FROM passports WHERE status != 'inactive'";

    req.app.locals.database.Get(query, function(data) {
        if (!data) return res.sendStatus(500);
        else if (data.length == 0) return res.sendStatus(404);

        var entities = [];
        for (var i = 0; i < data.length; i++) entities.push(passportToJson(data[i]));
        return res.send({entities: entities});
    });
};

exports.getPassport = function(req, res) {
    var query = "SELECT * FROM passports WHERE passport = '"+req.passport+"'";

    req.app.locals.database.Get(query, function(data) {
        if (!data) return res.sendStatus(500);
        else if (data.length == 0) return res.sendStatus(404);

        return res.send({entity: passportToJson(data[0])});
    });
};

exports.getPassportRelations = function(req, res) {
    var diffRelations = 4;
    var retrieved = 0;

    var relations = {};

    //Find all owned Validating Nodes
    var query = "SELECT * FROM nodes WHERE passport = '"+req.passport+"'";
    req.app.locals.database.Get(query, function(data) {
        retrieved++;
        if (!data) return res.sendStatus(500);
        else if (data.length == 0) return res.sendStatus(404);

        var nodes = [];
        for (var i = 0; i < data.length; i++) nodes.push(nodeToJson(data[i]));
        relations['nodes'] = nodes;
        if(retrieved == diffRelations) return res.send({relations: relations});
    });

    //Find all owned Managed Entities
    query = "SELECT * FROM entities WHERE passport = '"+req.passport+"'";
    req.app.locals.database.Get(query, function(data) {
        retrieved++;
        if (!data) return res.sendStatus(500);
        else if (data.length == 0) return res.sendStatus(404);

        var entities = [];
        for (var i = 0; i < data.length; i++) entities.push(nodeToJson(data[i]));
        relations['entities'] = entities;
        if(retrieved == diffRelations) return res.send({relations: relations});
    });

    //Find all managed DASs
    query = "SELECT * FROM das WHERE manager = '"+req.passport+"'";
    req.app.locals.database.Get(query, function(data) {
        retrieved++;
        if (!data) return res.sendStatus(500);
        else if (data.length == 0) return res.sendStatus(404);

        var das = [];
        for (var i = 0; i < data.length; i++) das.push(dasToJson(data[i]));
        relations['das'] = das;
        if(retrieved == diffRelations) return res.send({relations: relations});
    });

    //Find all supervised DAOs
    query = "SELECT * FROM dao WHERE supervisor = '"+req.passport+"'";
    req.app.locals.database.Get(query, function(data) {
        retrieved++;
        if (!data) return res.sendStatus(500);
        else if (data.length == 0) return res.sendStatus(404);

        var dao = [];
        for (var i = 0; i < data.length; i++) dao.push(daoToJson(data[i]));
        relations['dao'] = dao;
        if(retrieved == diffRelations) return res.send({relations: relations});
    });
};

exports.getEntities = function(req, res) {
    var query = "SELECT * FROM entities WHERE status != 'inactive'";

    req.app.locals.database.Get(query, function(data) {
        if (!data) return res.sendStatus(500);
        else if (data.length == 0) return res.sendStatus(404);

        var entities = [];
        for (var i = 0; i < data.length; i++) entities.push(entityToJson(data[i]));
        return res.send({entities: entities});
    });
};

exports.getEntity = function(req, res) {
    var query = "SELECT * FROM entities WHERE entity = '"+req.entity+"'";

    req.app.locals.database.Get(query, function(data) {
        if (!data) return res.sendStatus(500);
        else if (data.length == 0) return res.sendStatus(404);

        return res.send({entity: entityToJson(data[0])});
    });
};

exports.getEntitySlots = function(req, res) {
    var query = "SELECT * FROM slots WHERE entity = '"+req.entity+"' ORDER BY slot ASC LIMIT 100";

    //Add an offset if applicable
    if(req.query.offset && !isNaN(req.query.offset)) req.sql += " OFFSET "+req.query.offset;

    req.app.locals.database.Get(query, function(data) {
        if (!data) return res.sendStatus(500);
        else if (data.length == 0) return res.sendStatus(404);

        var slots = [];
        for (var i = 0; i < data.length; i++) slots.push(slotToJson(data[i]));
        return res.send({slots: slots});
    });
};

exports.getNodes = function(req, res) {
    var query = "SELECT * FROM nodes WHERE status != 'inactive'";

    req.app.locals.database.Get(query, function(data) {
        if (!data) return res.sendStatus(500);
        else if (data.length == 0) return res.sendStatus(404);

        var nodes = [];
        for (var i = 0; i < data.length; i++) nodes.push(nodeToJson(data[i]));
        return res.send({nodes: nodes});
    });
};

exports.getDAOs = function(req, res) {
    var query = "SELECT * FROM dao WHERE status != 'inactive'";

    req.app.locals.database.Get(query, function(data) {
        if (!data) return res.sendStatus(500);
        else if (data.length == 0) return res.sendStatus(404);

        var daos = [];
        for (var i = 0; i < data.length; i++) daos.push(daoToJson(data[i]));
        return res.send({organizations: daos});
    });
};

exports.getDAO = function(req, res) {
    var query = "SELECT * FROM dao WHERE dao = '"+req.dao+"'";

    req.app.locals.database.Get(query, function(data) {
        if (!data) return res.sendStatus(500);
        else if (data.length == 0) return res.sendStatus(404);

        return res.send(daoToJson(data[0]));
    });
};

exports.getDASs = function(req, res) {
    var query = "SELECT * FROM das WHERE status != 'inactive'";

    req.app.locals.database.Get(query, function(data) {
        if (!data) return res.sendStatus(500);
        else if (data.length == 0) return res.sendStatus(404);

        var dass = [];
        for (var i = 0; i < data.length; i++) dass.push(dasToJson(data[i]));
        return res.send({services: dass});
    });
};

exports.getDAS = function(req, res) {
    var query = "SELECT * FROM das WHERE das = '"+req.das+"'";

    req.app.locals.database.Get(query, function(data) {
        if (!data) return res.sendStatus(500);
        else if (data.length == 0) return res.sendStatus(404);

        return res.send(dasToJson(data[0]));
    });
};

exports.getResources = function(req, res) {
    var query = "SELECT * FROM resources WHERE status != 'inactive'";

    req.app.locals.database.Get(query, function(data) {
        if (!data) return res.sendStatus(500);
        else if (data.length == 0) return res.sendStatus(404);

        var resources = [];
        for (var i = 0; i < data.length; i++) resources.push(resourceToJson(data[i]));
        return res.send({resources: resources});
    });
};

exports.getResource = function(req, res) {
    var query = "SELECT * FROM resource WHERE resource = '"+req.resource+"'";

    req.app.locals.database.Get(query, function(data) {
        if (!data) return res.sendStatus(500);
        else if (data.length == 0) return res.sendStatus(404);

        return res.send(resourceToJson(data[0]));
    });
};