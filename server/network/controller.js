/**
 * Created by Hplus on 27/09/2015.
 */

var crypto = require('crypto');
var fs = require('fs');

var globals = require('../globals');
var util = require('../util');


function SaveLedgerToDB(app, nodeId, ledger) {
    var stats = fs.statSync(ledger);
    var data = JSON.parse(fs.readFileSync(ledger));

    var transactionsList = [];

    //Add all missing transactions
    for(var j = 0; j < data.transactions.length; j++) {
        var hash = Object.keys(data.transactions[j])[0];
        var n = j;

        query = 'SELECT count(*) FROM transactions WHERE hash = "'+hash+'" AND relays @> {"'+nodeId+'"}';
        app.locals.database.Get(query, function(data, hash, n) {
            if(!data || data.length == 0) {
                var raw = JSON.stringify(data.transactions[n]);

                //Calculate total currency exchanged
                var exchanged = 0;
                switch(data.transactions[n][hash].type) {
                    case globals.BASIC_TRANSACTION:
                        exchanged = data.transactions[n][hash].amount;
                        break;
                    case globals.DELAYED_TRANSACTION:
                        if(data.transactions[n][hash].event == 'request') exchanged = data.transactions[n][hash].outbound.fee + data.transactions[n][hash].inbound.fee;
                        else exchanged = data.transactions[n][hash].amount;
                        break;
                    case globals.FUTURE_TRANSACTION:
                        if(data.transactions[n][hash].event == 'execute') exchanged = data.transactions[n][hash].amount;
                        break;
                    case globals.DAO_TRANSACTION:
                        if(data.transactions[n][hash].DAO == "DAO0000000") exchanged = data.transactions[n][hash].total;
                        break;
                    case globals.DAS_TRANSACTION:
                        if(data.transactions[n][hash].DAS == "DAS0000000") exchanged = data.transactions[n][hash].total;
                        break;
                    default:break;
                }
                
                //Register missing transaction
                var sql = 'INSERT INTO transactions VALUES("'+hash+'","'+data.transactions[n][hash].type+'",'+data.transactions[n][hash].timestamp+
                    ','+raw+', '+exchanged+',default, '+raw.length+', {"'+nodeId+'"}) ON CONFLICT DO UPDATE SET relays = transactions.relays || {"'+nodeId+'"}';
                app.locals.database.Execute(sql);

                //Find all related accounts and save relation
                var matches = raw.match(globals.allAccountsRegex);
                var distinct = {};
                for(var acc in matches) distinct[acc] = hash;
                for(acc in distinct) {
                    query = 'INSERT INTO accounts_transactions(account, transaction) VALUES("'+acc+'", "'+hash+'") ON CONFLICT DO NOTHING;';
                    app.locals.database.Get(query);
                }

                //Emit transaction to users
                EmitTransaction(app, hash, data.transactions[n], exchanged);
            }
        });
        transactionsList.push(hash);
    }

    //Register Ledger
    var query = "INSERT INTO ledgers VALUES('"+data["ledgerId"]+"', '"+data["ledgerHash"]+"', '"+data["previousLedgerId"]+"', '"+
        data["previousLedgerHash"]+"', '"+data["accountsState"]+"', '"+data["transactionsRoot"]+"', "+data["opening"]+", "+data["closing"]+
        ", "+data["numberOfAccounts"]+", "+data["numberOfTransactions"]+", "+data["amountInCirculation"]+", "+data["amountTraded"]+", "+
        data["feesCollected"]+", {'"+transactionsList.join("','")+"'},'"+ledger+"', "+stats.size+", {'"+nodeId+"'})" +
        " ON CONFLICT (id) DO UPDATE SET relays = ledgers.relays || {'"+nodeId+"'}";

    app.locals.database.Execute(query, function(data) {
        if(!data) {}///log couldn't store ledger into database
    });

    //Save latest confirmed balances
    for(var i = 0; i < data.accounts.length; i++) {
        var account = Object.keys(data.accounts[i])[0];
        query = "INSERT INTO balances(account, balance, ledger) VALUES('"+account+"', '"+data.accounts[i][account]+"', '"+data["ledgerId"]+") ON CONFLICT DO NOTHING";
        app.locals.database.Execute(query, function(data) {
            if(!data) {}///log couldn't store latest balances into database
        });
    }

    //Emit Ledger
    app.locals.sio.emit('ledger', {
        id: data["ledgerId"],
        hash: data["ledgerHash"],
        closing: data["closing"],
        numberOfTransactions: data["numberOfTransactions"],
        amountTraded: data["amountTraded"],
        feesCollected: data["feesCollected"],
        size: stats.size
    });
}

function SaveBlockToDB(app, nodeId, block) {
    var query;
    var stats = fs.statSync(block);
    var data = JSON.parse(fs.readFileSync(block));

    var entriesList = [];
    //Insert all Network Management Entries
    for(var hash in data.entries) {
        var content = JSON.stringify(data.entries[hash]);
        query = "INSERT INTO entries VALUES('"+hash+"', '"+data.entries[hash].resource+"', "+JSON.stringify(data.entries[hash].data)+", '"+
            data.entries[hash].meta.type+"',"+data.entries[hash].meta.date+", '"+data.entries[hash].meta.version+"', '"+data.entries[hash].signer+
            "', '"+data.entries[hash].signature+"', {'"+hash+"':"+content+"}, "+data["blockId"]+", "+content.length+") ON CONFLICT DO NOTHING";
        app.locals.database.Execute(query);

        //Register information generated by the Entry
        ProcessEntry(app, entry);

        entriesList.push(hash);
    }

    //Register Network Management Block
    query = "INSERT INTO blocks VALUES('"+data["blockId"]+"', '"+data["blockHash"]+"', '"+data["previousBlockHash"]+"', "+data["date"]+
        ",'"+data["entriesRoot"]+"',"+entriesList.length+",{'"+entriesList.join("','")+"'}, "+block+"', "+stats.size+", {'"+nodeId+"'})" +
        " ON CONFLICT (id) DO UPDATE SET relays = blocks.relays || {'"+nodeId+"'}";

    app.locals.database.Execute(query, function(data) {
        if(!data) {}///log couldn't store Block into database
    });

    //Emit Network Management Block
    app.locals.sio.emit('block', {
        id: data["blockId"],
        hash: data["blockHash"],
        date: data["date"],
        numberOfEntries: entriesList.length,
        size: stats.size
    });
}

function ProcessEntry(app, entry) {
    var query, values;
    
    switch(entry.resource) {
        case "RESOURCE":
            switch(entry.meta.type) {
                case "create":
                    query = "INSERT INTO resources(resource, supervisor, protection,";
                    values = "VALUES('"+entry.data.designation+"', '"+entry.data.supervisor+"', '"+entry.data.protection+"'";
                    if(entry.data.identifiers) {
                        query += ", identifiers";
                        values += ", {'"+entry.data.identifiers.join("','")+"'}";
                    }
                    query += ", operations) "+values+", {'"+entry.data.operations.join("','")+"'})";
                    break;

                case "update":
                case "renew":
                    query = "UPDATE resources SET ";
                    if(entry.data.designation) query += "resource = '"+entry.data.resource+"', ";
                    if(entry.data.supervisor) query += "supervisor = '"+entry.data.supervisor+"', ";
                    if(entry.data.protection) query += "protection = '"+entry.data.protection+"', ";
                    if(entry.data.identifiers) query += "identifiers = {'"+entry.data.identifiers.join("','")+"'}, ";
                    if(entry.data.operations) query += "operations = {'"+entry.data.operations.join("','")+"'}, ";
                    query += ", status = 'active' WHERE resource = '"+ entry.data.designation + "'";
                    break;

                case "cancel":
                    query = "UPDATE resources SET status = 'inactive' WHERE resource = '" + entry.data.designation + "'";
                    break;
            }
            break;

        case "PASSPORT":
            switch(entry.meta.type) {
                case "create":
                    query = "INSERT INTO passports(passport";
                    values = "'"+entry.data.id+"'";
                    if(entry.data.designation) {
                        query += ", designation";
                        values += ",'"+entry.data.designation+"'";
                    }
                    if(entry.data.company) {
                        query += ", company";
                        values += ",'"+entry.data.company+"'";
                    }
                    if(entry.data.website) {
                        query += ", website";
                        values += ",'"+entry.data.website+"'";
                    }
                    if(entry.data.certificate) {
                        query += ", certificate";
                        values += ",'"+entry.data.certificate+"'";
                    }
                    query += ", public_key";
                    values += ",'"+entry.data.publicKey+"'";
                    if(entry.data.account) {
                        query += ", account";
                        values += ",'"+entry.data.account+"'";
                    }
                    if(entry.data.representative) {
                        query += ", representative";
                        values += ",'"+entry.data.representative+"'";
                    }
                    if(entry.data.email) {
                        query += ", email";
                        values += ",'"+entry.data.email+"'";
                    }
                    if(entry.data.contact) {
                        query += ", contact";
                        values += ",'"+entry.data.contact+"'";
                    }
                    if(entry.data.country) {
                        query += ", country";
                        values += ",'"+entry.data.country+"'";
                    }

                    query += ", last_updated, status) VALUES ("+values+", default, default)";
                    break;
                
                case "update":
                case "renew":
                    query = "UPDATE passports SET ";
                    if(entry.data.designation) query += "designation = '"+entry.data.designation+"',";
                    if(entry.data.company) query += "company = '"+entry.data.company+"',";
                    if(entry.data.website) query += "website = '"+entry.data.website+"',";
                    if(entry.data.certificate) query += "certificate = '"+entry.data.certificate+"',";
                    if(entry.data.publicKey) query += "public_key = '"+entry.data.publicKey+"',";
                    if(entry.data.account) query += "account = '"+entry.data.account+"',";
                    if(entry.data.representative) query += "representative = '"+entry.data.representative+"',";
                    if(entry.data.email) query += "email = '"+entry.data.email+"',";
                    if(entry.data.contact) query += "contact = '"+entry.data.contact+"',";
                    if(entry.data.country) query += "country = '"+entry.data.country+"',";
                    query += ", status = 'active' WHERE passport = '"+entry.data.id+"'";
                    break;

                case "cancel":
                    query = "UPDATE passports SET status = 'inactive' WHERE passport = '"+entry.data.id+"'";
                    break;
            }
            break;

        case "ENTITY":
            switch(entry.meta.type) {
                case "create":
                    query = "INSERT INTO entities(id, public_key, host, passport";
                    values = "VALUES('"+entry.data.id+"', '"+entry.data.publicKey+"', '"+entry.data.host+"', '"+entry.data.passport+"'";
                    if(entry.data.account) {
                        query += ", account";
                        values += ", '"+entry.data.account+"'";
                    }
                    query += ", last_updated, status) "+values+", default, default)";
                    break;

                case "update":
                case "renew":
                    query = "UPDATE entities SET ";
                    if(entry.data.publicKey) query += "public_key = '"+entry.data.publicKey+"',";
                    if(entry.data.host) query += "host = '"+entry.data.host+"',";
                    if(entry.data.passport) query += "passport = '"+entry.data.passport+"',";
                    if(entry.data.account) query += "account = '"+entry.data.account+"',";
                    query += ", status = 'active' WHERE id = '"+entry.data.id+"'";
                    break;

                case "cancel":
                    query = "UPDATE entities SET status = 'inactive' WHERE id = '" + entry.data.id + "'";
                    break;
            }
            break;

        case "NODE":
            switch(entry.meta.type) {
                case "create":
                    query = "INSERT INTO nodes(id, public_key, host, passport, version";
                    values = "VALUES('"+entry.data.id+"', '"+entry.data.publicKey+"', '"+entry.data.host+"', '"+entry.data.passport+"', '"+entry.data.version+"'";
                    if(entry.data.account) {
                        query += ", account";
                        values += ", '"+entry.data.account+"'";
                    }
                    query += ", last_updated, status) "+values+", default, default)";
                    break;

                case "update":
                case "renew":
                    query = "UPDATE nodes SET ";
                    if(entry.data.publicKey) query += "public_key = '"+entry.data.publicKey+"',";
                    if(entry.data.host) query += "host = '"+entry.data.host+"',";
                    if(entry.data.passport) query += "passport = '"+entry.data.passport+"',";
                    if(entry.data.networkVersion) query += "version = '"+entry.data.version+"',";
                    if(entry.data.account) query += "account = '"+entry.data.account+"',";
                    query += ", status = 'active' WHERE id = '"+entry.data.id+"'";
                    break;

                case "cancel":
                    query = "UPDATE nodes SET status = 'inactive' WHERE id = '" + entry.data.id + "'";
                    break;
            }
            break;

        case "DAO":
            switch(entry.meta.type) {
                case "create":
                    query = "INSERT INTO dao(doa, designation, supervisor, documentation, version, ";
                    values = "VALUES('"+entry.data.id+"', '"+entry.data.designation+"', '"+entry.data.supervisor+"', '"+entry.data.documentation+"', '"+entry.data.networkVersion+"'";
                    if(entry.data.account) {
                        query += "account, ";
                        values += ", '"+entry.data.account+"'";
                    }
                    query += "last_updated, status) "+values+", default, default)";
                    break;

                case "update":
                case "renew":
                    query = "UPDATE dao SET ";
                    if(entry.data.designation) query += "designation = '"+entry.data.designation+"',";
                    if(entry.data.supervisor) query += "supervisor = '"+entry.data.supervisor+"',";
                    if(entry.data.documentation) query += "documentation = '"+entry.data.documentation+"',";
                    if(entry.data.networkVersion) query += "version = '"+entry.data.version+"',";
                    if(entry.data.account) query += "account = '"+entry.data.account+"',";
                    query += ", status = 'active' WHERE id = '"+entry.data.id+"'";
                    break;

                case "cancel":
                    query = "UPDATE dao SET status = 'inactive' WHERE id = '" + entry.data.id + "'";
                    break;
            }
            break;

        case "DAS":
            switch(entry.meta.type) {
                case "create":
                    query = "INSERT INTO das(dos, designation, manager, documentation, version, ";
                    values = "VALUES('"+entry.data.id+"', '"+entry.data.designation+"', '"+entry.data.manager+"', '"+entry.data.documentation+"', '"+entry.data.networkVersion+"'";
                    if(entry.data.account) {
                        query += "account, ";
                        values += ", '"+entry.data.account+"'";
                    }
                    query += "last_updated, status) "+values+", default, default)";
                    break;

                case "update":
                case "renew":
                    query = "UPDATE das SET ";
                    if(entry.data.designation) query += "designation = '"+entry.data.designation+"',";
                    if(entry.data.manager) query += "manager = '"+entry.data.manager+"',";
                    if(entry.data.documentation) query += "documentation = '"+entry.data.documentation+"',";
                    if(entry.data.networkVersion) query += "version = '"+entry.data.version+"',";
                    if(entry.data.account) query += "account = '"+entry.data.account+"',";
                    query += ", status = 'active' WHERE id = '"+entry.data.id+"'";
                    break;

                case "cancel":
                    query = "UPDATE das SET status = 'inactive' WHERE id = '" + entry.data.id + "'";
                    break;
            }
            break;

        case "ACCOUNT":
            switch(entry.meta.type) {
                case "create":
                    query = "INSERT INTO accounts VALUES('"+entry.data.account+"', '"+entry.data.publicKey+"', default, default)";
                    break;

                case "update":
                    if(entry.data.publicKey) query = "UPDATE accounts SET public_key = '"+entry.data.publicKey+"' WHERE account = '"+entry.data.account+"'";
                    else return;
                    break;

                case "renew":
                case "cancel":
                    return;
            }
            break;

        case "SLOT":
            switch(entry.meta.type) {
                case "create":
                    query = "INSERT INTO slots VALUES('"+entry.data.slot+"', '"+entry.data.manager+"', default, default, default)";
                    break;

                case "update":
                case "renew":
                    if(entry.data.manager) query = "UPDATE slots SET entity = '"+entry.data.manager+"' WHERE slot = '"+entry.data.slot+"'";
                    else return;
                    break;

                case "cancel":
                    query = "UPDATE slots SET status = 'inactive' WHERE id = '" + entry.data.id + "'";
                    break;
            }
            break;

        default: return;
    }

    app.locals.database.Execute(query);
}

function EmitTransaction(app, hash, tx, exchanged) {
    app.locals.sio.emit('transaction', {
        hash: hash,
        type: tx[hash].type,
        timestamp: tx[hash].timestamp,
        exchanged: exchanged
    });
}

/**
 * @return {boolean}
 */
exports.PublisherHandler = function(app, nodeId, socket, data) {
    data = data.toString();
    var query, result, file;

    if(app.locals.receivingBlock[nodeId]) {
        file = globals.blocksStorage+app.locals.receivingBlock[nodeId]+nodeId+globals.blockExtension;
        fs.appendFileSync(file, data);

        if(data.length < 4096) {
            app.locals.receivingBlock[nodeId] = false;
            result = app.locals.database.Get("SELECT id FROM blocks ORDER BY id DESC LIMIT 1");

            var block = 0;
            if(result && result[0] && result[0].id) block = parseInt(result[0].id)+1;

            fs.renameSync(file, globals.blocksStorage+block+globals.blockExtension);
            SaveBlockToDB(app, nodeId, block);
            return true;
        }
        else return (data.length == 4096);
    }
    else if(app.locals.receivingLedger[nodeId]) {
        file = globals.ledgersStorage+app.locals.receivingBlock[nodeId]+nodeId+globals.ledgerExtension;
        fs.appendFileSync(file, data);

        if(data.length < 4096) {
            app.locals.receivingLedger[nodeId] = false;
            result = app.locals.database.Get("SELECT id FROM ledgers ORDER BY id DESC LIMIT 1");

            var ledger = 0;
            if(result && result[0] && result[0].id) ledger = parseInt(result[0].id)+1;

            fs.renameSync(file, globals.ledgersStorage+ledger+globals.ledgerExtension);
            SaveLedgerToDB(app, nodeId, ledger);
            return true;
        }
        else return (data.length == 4096);
    }
    else {
        var protocolCode, signature;
        if(data.length >= 2) protocolCode = (data[1] << 8) | (data[0] & 0xFF);

        var total_length = util.array_to_int(data.substr(2,4), 4);

        //Retrieve signature
        var sig_length = util.array_to_int(data.substr(6,1), 1);
        signature = data.substr(7, sig_length);
        if(!globals.keyRegex.test(signature)) return false;

        switch (protocolCode) {
            case globals.NETWORK_PUBLISH_TRANSACTION: {
                //Retrieve transaction
                var tx_length = util.array_to_int(data.substr(7+sig_length,1), 1);
                var tx = data.substr(8+sig_length, tx_length);

                //Retrieve hash and load it
                var hash = tx.substr(2,40);
                var jsonTx = JSON.parse(tx);

                //Calculate total currency exchanged
                var exchanged = 0;
                switch(jsonTx[hash].type) {
                    case globals.BASIC_TRANSACTION:
                        exchanged = jsonTx[hash].amount;
                        break;
                    case globals.DELAYED_TRANSACTION:
                        if(jsonTx[hash].event == 'request') exchanged = jsonTx[hash].outbound.fee + jsonTx[hash].inbound.fee;
                        else exchanged = jsonTx[hash].amount;
                        break;
                    case globals.FUTURE_TRANSACTION:
                        if(jsonTx[hash].event == 'execute') exchanged = jsonTx[hash].amount;
                        break;
                    case globals.DAO_TRANSACTION:
                        if(jsonTx[hash].DAO == "DAO0000000") exchanged = jsonTx[hash].total;
                        break;
                    case globals.DAS_TRANSACTION:
                        if(jsonTx[hash].DAS == "DAS0000000") exchanged = jsonTx[hash].total;
                        break;
                    default:break;
                }

                //Store transaction
                query = 'INSERT INTO transactions VALUES("'+hash+'","'+jsonTx[hash].type+'",'+jsonTx[hash].timestamp+','+tx+','+exchanged+',default, '+
                    tx_length+', {"'+nodeId+'"}) ON CONFLICT (hash) DO UPDATE SET relays = transactions.relays || {"'+nodeId+'"}';
                app.locals.database.Execute(query);

                //Find all related accounts and save relation
                var matches = tx.match(globals.allAccountsRegex);
                var distinct = {};
                for(var acc in matches) distinct[acc] = hash;
                for(acc in distinct) {
                    query = 'INSERT INTO accounts_transactions(account, transaction) VALUES("'+acc+'", "'+hash+'") ON CONFLICT DO NOTHING';
                    app.locals.database.Get(query);
                }

                //Emit transaction to users
                EmitTransaction(app, hash, jsonTx, exchanged);
                return true;
            }

            case globals.NETWORK_PUBLISH_LEDGER: {
                //retrieve Ledger length
                var ledger_length = util.array_to_int(data.substr(7+sig_length,4), 4);
                //Start receiving Ledger
                app.locals.receivingLedger[nodeId] = ledger_length;
                return true;
            }

            case globals.NETWORK_PUBLISH_BLOCK: {
                //retrieve Block length
                var block_length = util.array_to_int(data.substr(7+sig_length,4), 4);
                //Start receiving Network Management Block
                app.locals.receivingBlock[nodeId] = block_length;
                return true;
            }

            default: return false;
        }
    }
};

/**
 * @return {boolean}
 */
exports.UpdatesHandler = function(app, socket, data) {
    data = data.toString();
    var result, length, protocolCode, table, query;

    if (data.length >= 6) protocolCode = (data[1] << 8) | (data[0] & 0xFF);
    else return false;

    var what = data.substr(2, globals.TRACKER_CODE_LENGTH);
    switch(what) {
        case globals.TRACKER_CODE_TRANSACTION: {
            table = 'transactions';
            break;
        }
        case globals.TRACKER_CODE_LEDGER: {
            table = 'ledgers';
            break;
        }
        case globals.TRACKER_CODE_NMB: {
            table = 'blocks';
            break;
        }
        case globals.TRACKER_CODE_NME: {
            table = 'entries';
            break;
        }
        default: return false;
    }

    switch (protocolCode) {
        case globals.NETWORK_TRACKER_GET: {
            var how;
            if(data[2+globals.TRACKER_CODE_LENGTH] == globals.TRACKER_GET_BY_HASH) {
                how = ' WHERE hash = "'+data.substr(3+globals.TRACKER_CODE_LENGTH)+'"';
            }
            else if(data[2+globals.TRACKER_CODE_LENGTH] == globals.TRACKER_GET_BY_ID) {
                how = ' WHERE id = '+data.substr(3+globals.TRACKER_CODE_LENGTH);
            }
            else return false;

            switch(what) {
                case globals.TRACKER_CODE_TRANSACTION:
                case globals.TRACKER_CODE_NME:
                    query = 'SELECT raw FROM '+table+how;
                    //Fetch the raw json
                    result = app.locals.database.Get(query);
                    if(result && result.length>0) {
                        //Encode data length
                        length = [];
                        length = util.int_to_array(result[0].raw.length, 4, 0, length);

                        //Send it back
                        socket.write(length.join('')+result[0].raw, function() {
                            return true;
                        });
                    }
                    else return false;
                    break;

                case globals.TRACKER_CODE_LEDGER:
                case globals.TRACKER_CODE_NMB:
                    query = 'SELECT static_file, size FROM '+table+how;

                    //Fetch the data file location and its size
                    result = app.locals.database.Get(query);
                    if(result && result.length>0) {
                        //Encode file length
                        length = [];
                        length = util.int_to_array(result[0].size, 4, 0, length);

                        //open file
                        var fd = fs.openSync(result[0].static_file, 'r');

                        //Send it back
                        socket.write(length.join(''));
                        var sent = 0;
                        while(sent != result[0].size) {
                            var buffer;
                            if(result[0].size - sent > 4096) {
                                fs.readSync(fd, buffer, 0, 4096, sent);
                                sent += 4096;
                            }
                            else {
                                fs.readSync(fd, buffer, 0, result[0].size - sent, sent);
                                sent = result[0].size;
                            }
                            if(!socket.write(buffer)) return false;
                        }
                        return true;
                    }
                    else return false;
                    break;
            }
            break;
        }

        case globals.NETWORK_TRACKER_LATEST: {
            if(what == globals.TRACKER_CODE_LEDGER || what == globals.TRACKER_CODE_NMB) {
                //Fetch the latest hash
                query = 'SELECT hash FROM '+table+' ORDER BY id DESC LIMIT 1';
                result = app.locals.database.Get(query);
                //Send it back
                if(result && result.length>0) {
                    socket.write(result[0].hash, function() {
                        return true;
                    });
                }
                else return false;
            }
            else return false;
            break;
        }

        default: return false;
    }
};