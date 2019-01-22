var schedule = require('node-schedule');
var as = require("./aerospike");
let lm = require('loader-message');

module.exports.job = schedule.scheduleJob('*/20 * * * *', function () {
    as.syn();  // No relation to Mr. Gates
});

module.exports.dbconn = schedule.scheduleJob("*/10 * * * *", function () {
    as.checkconn()
});

module.exports.precomp = schedule.scheduleJob('55 7 2 2 *', function () {
    as.precomp()
});

schedule.scheduleJob('* * * * *', function f() {
    settings.lm = lm.phrase()
});