var express = require('express');
var router = express.Router();
var sched = require('../src/scheduler');

let now = Date.now();

logger.warn("Your webapp must be running at " + sched.precomp.nextInvocation() + ".\n That is in " + (sched.precomp.nextInvocation().getTime() - now) / 60 + " minutes");

router.get('/', function (req, res, next) {
    res.render('sched.html', {settings: settings, time: sched.job.nextInvocation()})
});

module.exports = router;