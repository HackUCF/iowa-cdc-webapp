var schedule = require('node-schedule');
var as = require("./aerospike");

module.exports.job = schedule.scheduleJob('31 * * * *', function () {
    as.syn();  // No relation to Mr. Gates
});

module.exports.dbconn = schedule.scheduleJob("*/10 * * * *", function () {
    as.checkconn()
});

module.exports.precomp = schedule.scheduleJob('55 7 2 2 *', function () {
    as.precomp()
});