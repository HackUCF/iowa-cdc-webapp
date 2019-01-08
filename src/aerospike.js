const Aerospike = require('aerospike');
const uuid = require('uuid/v4');
let randomItem = require('random-item');
let request = require('request');

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
var references = ["Sounding the Seventh Trumpet", "Waking the Fallen", "City of Evil", "Avenged Sevenfold", "Nightmare", "Hail to the King", "HAIL TO THE KING: DEATHBAT – ORIGINAL VIDEO GAME SOUNDTRACK", "The Stage", "LIVE AT THE GRAMMY MUSEUM®", "The Stage: Deluxe Edition", "Black Reign"]

module.exports.checkconn = function checkConnection() {
    if (!client.isConnected()) {
        client.connect()
    }
};

module.exports.syn = function () {
    try {
        logger.debug("HAIL TO THE KING " + new Date().toISOString());
        getUpstream(function () {
            doTransfers();
            doAdds();
        })
    } catch (e) {
        logger.error(e)
    }
};


function getUpstream(callback) {
    var scan = client.scan("minimoira", "accounts");
    var stream = scan.foreach();
    stream.on('error', error => {
        logger.error(error);
    });
    stream.on('end', () => {
        callback()
    });
    stream.on('data', record => {
        request.get({
            uri: '/transfer.cgi',
            baseUrl: settings.P9_2_json.ip,
            useQuerystring: true,
            qs: {
                bankn: settings.team,
                accnt: record.bins.account_number
            }
        }, function (error, response, body) {
            if (error) {
                logger.error(error)
            } else {
                let key = new Aerospike.Key('minimoira', 'accounts', record.bins.account_number);
                client.put(key, {amount: parseFloat(body.balance), owner: body.owner}, function (err, key) {
                    if (err) logger.error(err);
                    else logger.info(JSON.stringify({body: body, key: key}, null, 4))
                })
            }
        })
    })
}


function doTransfers() {
    let scan = client.scan("minimoira", "transfers");
    var stream = scan.foreach();
    stream.on('error', error => {
        logger.error(error);
    });
    stream.on('end', () => {
        client.truncate('minimoira', 'transfers', function () {
            logger.info(randomItem(references));
        })
    });
    stream.on('data', record => {
        let bins = record.bins;
        request.post({
            uri: '/transfer.cgi',
            baseUrl: settings.P9_2_json.ip,
            useQuerystring: true,
            qs: {
                pin: bins.pin
            },
            body: bins,
            json: true
        })
    })
}


function doAdds() {
    let scan = client.scan("minimoira", "adds");
    var stream = scan.foreach();
    stream.on('error', error => {
        logger.error(error);
    });
    stream.on('end', () => {
        client.truncate('minimoira', 'adds', function () {
            logger.info(randomItem(references));
        })
    });
    stream.on('data', record => {

    })
}


module.exports.test = function () {
    const key = new Aerospike.Key('minimoira', 'demo', 'demo');
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

function addUser(uname, pass, callback) {
    let key = new Aerospike.Key("minimoira", "users", uname);
    client.put(key, {
        uname: uname,
        pass: pass
    }).then(record => {
        callback(record)
    }).catch(error => logger.error(error))
}

module.exports.addUser = addUser;

function getUser(uname, callback) {
    client.get(new Aerospike.Key("minimoira", "users", uname), function (error, record) {
        if (error) {
            switch (error.code) {
                case Aerospike.status.AEROSPIKE_ERR_RECORD_NOT_FOUND:
                    addUser(uname, "cdc", function () {
                        getUser(uname, function (res) {
                            callback(res)
                        })
                    });
                    break;
                default:
                    console.log('ERR - ', error, key)
            }
        } else {
            callback(record)
        }
    })
}

module.exports.getUser = getUser;


module.exports.newAccount = function (acount_number = 0, owner = "TheToddLuci0", bal = 666.0, pin = 1234) {
    this.checkconn();
    let key = new Aerospike.Key("minimoira", "accounts", acount_number);
    const policy = new Aerospike.WritePolicy({
        exists: Aerospike.policy.exists.CREATE_OR_REPLACE
    });
    client.put(key, {
        pin: pin,
        account_number: acount_number,
        owner: owner,
        amount: new Aerospike.Double(bal)
    }, policy)
    request.post({
        baseUrl: settings.P9_2_json.ip + settings.P9_2_json.port.toString(),
        uri: '/acct.cgi',
        json: true,
        body: {
            bank: settings.team,
            name: owner,
            pin: pin,
            balance: bal,
            acct: acount_number
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
    let key = new Aerospike.Key("minimoira", "transfers", id);
    client.put(key, {
        action: "transfer",
        faccnt: parseInt(data.account_number),
        fbank: parseInt(settings.team),
        amount: new Aerospike.Double(parseFloat(data.amount)),
        pin: parseInt(data.pin),
        taccnt: parseInt(data.destination.account_number),
        tbank: parseInt(data.destination.branch)
    });
    add({account_number: data.account_number, amount: 0 - data.amount}, function (res) {
        callback1(res)
    })
}


module.exports.truncate = function (req, res, next) {
    client.truncate('minimoira', "accounts", function () {
        logger.info('Done 1')
    });
    client.truncate('minimoira', 'adds', function () {
        logger.info('Done 2')
    });
    client.truncate('minimoira', 'transfers', function () {
        logger.info('Done 3')
    });
    next()
};


function add(data, callback) {
    // let key = new Aerospike.Key("minimoira", "accounts", data.account_number);
    let key = new Aerospike.Key("minimoira", "accounts", data.account_number.toString());
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


function newAdd(data, callback1) {
    let id = uuid();
    let key = new Aerospike.Key("minimoira", "adds", id);
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
    let key = new Aerospike.Key("minimoira", "accounts", account_number);
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
    var scan = client.scan("minimoira", "accounts");
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
    var scan = client.scan("minimoira", set);
    var stream = scan.foreach();
    stream.on('error', error => {
        logger.error(error);
    });
    stream.on('end', () => {
        callback(null, all)
    });
    stream.on('data', record => {
        all.push(record)
    })
};


module.exports.addComment = function (callback, set = "propaganda", bins) {
    let key = new Aerospike.Key('minimoira', set, uuid());
    client.put(key, bins, function (error, key) {
        callback(error, key)
    })
};

module.exports.precomp = function () {
    client.truncate('minimoira', 'accounts', function () {
        client.truncate('minimoira', 'adds', function () {
            client.truncate('minimoira', 'transfers', function () {
                request.get({
                    baseUrl: settings.P9_2_json.ip + settings.P9_2_json.port.toString(),
                    uri: '/read.cgi',
                    qs: {
                        bank: settings.team.toString(),
                        acct: 'ALL'
                    }
                }, function (err, resp, body) {
                    if (err) {
                        logger.error(err);
                        logger.error("Your database failed to do it's pre comp sync. I would recommend you fix this ASAP")
                    } else {
                        for (acct of body.accounts) {
                            let ac = {};
                            ac.account_number = acct.acct;
                            ac.balance = parseFloat(acct.balance);
                            ac.owner = ac.name;
                            let key = new Aerospike.Key('minimoira', 'accounts', acct.acct);
                            client.put(key, ac)
                                .then(logger.info("Updated " + JSON.stringify(key, null, 4)))
                                .catch(err => {
                                    logger.error(err);
                                    logger.error("Your database failed to do it's pre comp sync. I would recommend you fix this ASAP")
                                })
                        }
                    }
                })
            })
        })
    })
};
