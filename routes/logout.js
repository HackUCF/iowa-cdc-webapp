var express = require('express');
var router = express.Router();
const buddy = require('../src/jwtbuddy');

router.get('/', function (req, res, next) {
    buddy.blacklist(req.cookies.session, function(err){
      res.cookie('session', '');
      res.redirect('/');
    });
});

module.exports = router;
