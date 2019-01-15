var schedule = require('node-schedule');
var as = require("./aerospike");

module.exports.job = schedule.scheduleJob('31 * * * *', function () {
    logger.info("Scheduled task running: aerospike sync");
    as.syn();  // No relation to Mr. Gates
});

module.exports.dbconn = schedule.scheduleJob("*/10 * * * *", function () {
    logger.info("Scheduled task running: connection check");
    as.checkconn()
});

module.exports.precomp = schedule.scheduleJob('55 7 2 2 *', function () {
    logger.info("Scheduled task running: pre-competition");
    as.precomp()
});
