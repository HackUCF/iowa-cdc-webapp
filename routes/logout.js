var express = require('express');
var router = express.Router();
const buddy = require('../src/jwtbuddy');

router.get('/', function (req, res, next) {
    if (!req.isAuthenticated())
        res.redirect('/');
    
    buddy.blacklist(req.cookies.session, function(err){
      res.cookies.session = "";
      res.redirect('/');
    });
});

module.exports = router;
