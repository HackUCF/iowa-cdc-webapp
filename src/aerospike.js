const Aerospike = require('aerospike');
const uuid      = require('uuid/v4');
let request     = require('request');
let httpe       = require('http-errors');

const config = as_settings;
let policies = {
    // exists: Aerospike.policy.exists.IGNORE
    write: new Aerospike.WritePolicy({
        exists: Aerospike.policy.exists.IGNORE
    })
};

config.policies = policies;
var client = new Aerospike.client(config);
client.captureStackTraces = true;
client.connect().then(logger.info('Client Connected')).catch(reason => {
    logger.error(reason)
});

module.exports.checkconn = function checkConnection() {
    if (!client.isConnected()) {
        client.connect()
    }
};

module.exports.syn = function () {
    try {
        logger.debug("SYN Called, will now fetch data from upstream. [" + new Date().toISOString() + "]");
        getUpstream(function () {
            doTransfers();
            doAdds();
        })
    } catch (e) {
        logger.error(e)
    }
};


function getUpstream(callback) {
    try {
        var scan = client.scan(settings.db_namespace, "accounts");
        var stream = scan.foreach();
        stream.on('error', error => {
            logger.error(error);
        });
        stream.on('end', () => {
            callback()
        });
        stream.on('data', record => {
            request.get({
                uri: settings.P9_2_json.proto + '://' + env.B2N_SERVICE_AUTH + '@' + settings.P9_2_json.ip + ':' + settings.P9_2_json.port + env.B2N_SERVICE_PATH + '/read.cgi',
                useQuerystring: true,
                qs: {
                    bankn: settings.team,
                    accnt: record.bins.account_number
                }
            }, function (error, response, body) {
                if (error) {
                    logger.error(error)
                } else {
                    // Can we possibly change this to work on request status code?
                    // I feel like this isn't a great way to distinguish errors
                    if (!JSON.stringify(body).toLowerCase().includes("internal server error")) {
                        logger.info(JSON.stringify(body, null, 4));
                        let key = new Aerospike.Key(settings.db_namespace, 'accounts', record.bins.account_number);
                        client.put(key, {
                            amount: parseFloat(body.balance),
                            owner: body.name
                        }, function (err, key) {
                            if (err) logger.error(err);
                            else logger.info({body: body, key: key})
                        })
                    }
                }
            })
        })
    } catch (e) {
        logger.error(e)
    }
}


function doTransfers() {
    let scan = client.scan(settings.db_namespace, "transfers");
    var stream = scan.foreach();
    stream.on('error', error => {
        logger.error(error);
    });
    stream.on('end', () => {
        client.truncate(settings.db_namespace, 'transfers', function () {
            logger.info("doTransfers: stream finished.");
        })
    });
    stream.on('data', record => {
        let bins = record.bins;
        logger.debug(JSON.stringify(bins))
        request.post({
            uri: settings.P9_2_json.proto + '://' + env.B2N_SERVICE_AUTH + '@' + settings.P9_2_json.ip + ':' + settings.P9_2_json.port + env.B2N_SERVICE_PATH + '/transaction.cgi',
            useQuerystring: true,
            qs: {
                pin: bins.pin
            },
            body: bins,
            json: true
        }, function (err, resp, body) {
            if (err) logger.error(err)
            else {
                logger.info(body)
            }
        })
    })
}


function doAdds() {
    let scan = client.scan(settings.db_namespace, "adds");
    var stream = scan.foreach();
    stream.on('error', error => {
        logger.error(error);
    });
    stream.on('end', () => {
        client.truncate(settings.db_namespace, 'adds', function () {
            logger.info("doAdds: stream finished.");
        })
    });
    stream.on('data', record => {

    })
}


module.exports.test = function () {
    const key = new Aerospike.Key(settings.db_namespace, 'demo', 'demo');
    Aerospike.connect(config)
        .then(client => {
            const bins = {
                i: 123,
                s: 'hello',
                b: Buffer.from('world'),
                d: new Aerospike.Double(3.1415),
                g: Aerospike.GeoJSON.Point(103.913, 1.308),
                l: [1, 'a', {x: 'y'}],
                m: {foo: 4, bar: 7}
            }
            const meta = {ttl: 10000}
            const policy = new Aerospike.WritePolicy({
                exists: Aerospike.policy.exists.CREATE_OR_REPLACE
            })

            return client.put(key, bins, meta, policy)
                .then(() => {
                    const ops = [
                        Aerospike.operations.incr('i', 1),
                        Aerospike.operations.read('i'),
                        Aerospike.lists.append('l', 'z'),
                        Aerospike.maps.removeByKey('m', 'bar')
                    ]

                    return client.operate(key, ops)
                })
                .then(result => {
                    logger.info(result.bins) // => { i: 124, l: 4, m: null }

                    return client.get(key)
                })
                .then(record => {
                    logger.info(record.bins) // => { i: 124,
                                             //      s: 'hello',
                                             //      b: <Buffer 77 6f 72 6c 64>,
                                             //      d: 3.1415,
                                             //      g: '{"type":"Point","coordinates":[103.913,1.308]}',
                                             //      l: [ 1, 'a', { x: 'y' }, 'z' ],
                                             //      m: { foo: 4 } }
                })
                .then(() => client.close())
        })
        .catch(error => {
            logger.error('Error: %s [%i]', error.message, error.code)
            if (error.client) {
                error.client.close()
            }
        });
};

module.exports.delete_acct = function (account_number, callback) {
    let key = new Aerospike.Key(settings.db_namespace, 'accounts', account_number.toString())
    client.remove(key, function (err, key) {
        if (err) logger.error(err)
        else logger.info(key)
        callback()
    })
};

// TODO Figure out how to work this in with passport
//      When we make a new user with passport, we also
//      have to create a new bank account with the bank
module.exports.newAccount = function (acount_number = 0, owner, bal, pin = 0, callback) {
    this.checkconn();
    request.post({
        uri: settings.P9_2_json.proto + '://' + env.B2N_SERVICE_AUTH + '@' + settings.P9_2_json.ip + ':' + settings.P9_2_json.port + env.B2N_SERVICE_PATH  + '/acct.cgi',
        json: true,
        body: {
            bank: settings.team.toString(),
            name: owner,
            pin: pin.toString(),
            balance: bal.toString(),
            acct: acount_number.toString()
        }
    }, function (err, response, body) {
        if (err) {
            logger.error(err);
            callback(0)
        } else if (!body.acct) {
            callback(0);
            this.emit('error', httpe(400, 'https://http.cat/400'));
        } else {
            logger.info(body);
            let key = new Aerospike.Key(settings.db_namespace, "accounts", body.acct);
            const policy = new Aerospike.WritePolicy({
                exists: Aerospike.policy.exists.CREATE_OR_REPLACE
            });
            client.put(key, {
                pin: pin,
                account_number: body.acct,
                owner: owner,
                amount: new Aerospike.Double(parseFloat(bal))
            }, policy, (err, key) => {
                if (err) {
                    logger.error(err)
                    callback(0)
                } else {
                    logger.info(key)
                    addTransfer({
                        account_number: 0,
                        amount: bal,
                        pin: 1337,
                        destination: {
                            branch: settings.team,
                            account_number: body.acct
                        }
                    }, (d) => {
                        logger.info(d);
                        callback(body.acct);
                    })
                }
            })
        }
    })
};


module.exports.addTransaction = function (type, data, callback) {
    let res = false;
    switch (type.toLowerCase()) {
        case "transfer":
            addTransfer(data, function (res) {
                callback(null, res)
            });
            break;
        case "add":
            newAdd(data, function (res) {
                callback(null, res)
            });
            break;
        default:
            callback(new Error("METHOD_NOT_IMPLEMENTED"), null)
    }
};


function addTransfer(data, callback1) {
    let id = uuid();
    let key = new Aerospike.Key(settings.db_namespace, "transfers", id);
    client.put(key, {
        action: "transfer",
        facct: parseInt(data.account_number),
        fbank: parseInt(settings.team),
        amount: new Aerospike.Double(parseFloat(data.amount)),
        pin: parseInt(data.pin),
        tacct: parseInt(data.destination.account_number),
        tbank: parseInt(data.destination.branch)
    });
    add({account_number: data.account_number, amount: 0 - data.amount}, function (res) {
        callback1(res)
    })
}


module.exports.truncate = function (req, res, next) {
    client.truncate(settings.db_namespace, "accounts", function () {
        logger.info('truncate: finished truncating accounts')
    });
    client.truncate(settings.db_namespace, 'adds', function () {
        logger.info('truncate: finished truncating adds')
    });
    client.truncate(settings.db_namespace, 'transfers', function () {
        logger.info('truncate: finished truncating transfers')
    });
    next()
};


// TODO Uh.. That's not a great callback. What is this used for?
function add(data, callback) {
    // let key = new Aerospike.Key(settings.db_namespace, "accounts", data.account_number);
    let key = new Aerospike.Key(settings.db_namespace, "accounts", data.account_number.toString());
    logger.debug(JSON.stringify(key, null, 4))
    logger.debug(JSON.stringify(data, null, 4));
    client.get(key).then(record => {
        client.put(key, {amount: parseFloat(record.bins.amount) + parseFloat(data.amount)}, function (error, key) {
            callback(error, "It did _something_, idk if its the thing you asked for tho")
        })
    }).catch(e => {
        logger.error(JSON.stringify(e, null, 4))
    })
}

module.exports.getUser = function (username, callback) {
  client.exists(new Aerospike.Key(settings.db_namespace, "users", username), function (error, result) {
    if (error) {
      logger.error("Error while checking for user: " + username);
      callback(error, null);
    } else if (result) {
      return client.get(new Aerospike.Key(settings.db_namespace, "users", username), (err, user) => {
          return callback(error, user)
      });
    } else {
       logger.error("Nonexistent user attempted to log in: " + username);
       callback(error, null);
    }
  });
}

function newAdd(data, callback1) {
    let id = uuid();
    let key = new Aerospike.Key(settings.db_namespace, "adds", id);
    client.put(key, {
        action: "add",
        amnt: new Aerospike.Double(data.amount),
        pin: parseInt(data.pin),
        acct: parseInt(data.account_number)
    });
    add({account_number: data.account_number, amount: data.amount}, function (res) {
        add({account_number: 0, amount: 0 - data.amount}, function () {
            callback1(res)
        })
    })
}

module.exports.getAccount = function (account_number = 0, callback) {
    let key = new Aerospike.Key(settings.db_namespace, "accounts", account_number);
    logger.debug(JSON.stringify(key, null, 4))
    client.get(key, function (err, rec) {
        if (err) {
            logger.error(err);
            callback(err, null)
        } else {
            callback(null, rec.bins)
        }
    })
};

module.exports.getAllAccounts = function (callback) {
    let all = {};
    var scan = client.scan(settings.db_namespace, "accounts");
    var stream = scan.foreach();
    stream.on('error', error => {
        logger.error(error);
    });
    stream.on('end', () => {
        callback(null, all)
    });
    stream.on('data', record => {
        all[record.bins.account_number] = record;
    })
};

module.exports.getComments = function (callback, set = "propaganda") {
    let all = [];
    var scan = client.scan(settings.db_namespace, set);
    var stream = scan.foreach();
    stream.on('error', error => {
        logger.error(error);
    });
    stream.on('end', () => {
        callback(null, all)
    });
    stream.on('data', record => {
        all.push({"set":record.bins.set, "uname":record.bins.uname, "comment":record.bins.comment});
    })
};


module.exports.addComment = function (callback, set = "propaganda", bins) {
    let key = new Aerospike.Key(settings.db_namespace, set, uuid());
    client.put(key, bins, function (error, key) {
        callback(error, key)
    })
};

module.exports.addBlacklistedJWT = function (jwt, callback) {
    let key = new Aerospike.Key(settings.db_namespace, "jwt_blacklist", uuid());
    client.put(key, {token: jwt}, function (error, key) {
        if(error)
          logger.error("Error while blacklisting a JWT");
          
        callback(error);
    })
};

module.exports.checkJWTBlacklist = function(jwt, callback) {
  client.exists(new Aerospike.Key(settings.db_namespace, "jwt_blacklist", jwt), function (error, result) {
    if (error) {
      logger.error("Error while checking JWT blacklist");
      callback(error, null);
    } else if (result) {
     return callback(error, true)
    } else {
       callback(error, false);
    }
  });
};

// We can call this prior to competition.
module.exports.precomp = function () {
    client.truncate(settings.db_namespace, 'accounts', function () {
        client.truncate(settings.db_namespace, 'adds', function () {
            client.truncate(settings.db_namespace, 'transfers', function () {
                request.get({
                    uri: settings.P9_2_json.proto + '://' + env.B2N_SERVICE_AUTH + '@' + settings.P9_2_json.ip + ':' + settings.P9_2_json.port + env.B2N_SERVICE_PATH + '/read.cgi',
                    useQuerystring: true,
                    qs: {
                        bank: settings.team.toString(),
                        acct: 'ALL'
                    }
                }, function (err, resp, body) {
                    if (err) {
                        logger.error(err);
                        logger.error("Pre-competition sync: Connection to bank2node service failed!")
                    } else {
                        logger.info(body)
                        body = JSON.parse(body);
                        for (acct of body.accounts) {
                            logger.info(JSON.stringify(acct));
                            let ac = {};
                            ac.account_number = acct.acct;
                            ac.balance = parseFloat(acct.balance);
                            ac.owner = acct.name;
                            let key = new Aerospike.Key(settings.db_namespace, 'accounts', acct.acct);
                            client.put(key, ac, function (err, key) {
                                if (err) {
                                    logger.error(err);
                                    logger.error("Pre-competition sync: failed to update account information for " + key);
                                } else {
                                    logger.info("Updated " + JSON.stringify(key, null, 4));

                                }
                            })
                        }
                    }
                })
            })
        })
    })
};
