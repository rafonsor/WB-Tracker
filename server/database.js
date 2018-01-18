/**
 * Created by Hplus on 26/09/2015.
 */

var db = require('pg');

db.defaults.host = '127.0.0.1';
db.defaults.port = 5432;
db.defaults.database = 'datatracker';
db.defaults.user = 'postgres';
db.defaults.password = 'rafael';
db.defaults.poolSize = 25;
db.defaults.ssl = false;


db.Execute = function(query, callback) {
    db.connect(function(err, client, done) {
        if(!err) client.query(query, function(error, result) {
            done();
            return callback((result.rowCount > 0));
        });
        else {
            done();
            return callback(false);
        }
    });
};

db.Get = function(query, callback) {
    db.connect(function(err, client, done) {
        if(!err) client.query(query, function(error, result) {
            done();

            if(!error && result.rowCount > 0) return callback(result.rows);
            else return callback([]);
        });
        else {
            done();
            return callback(false);
        }
    });
};

exports.db = db;
