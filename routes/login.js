var express = require('express');
var router = express.Router();
var passport = require('passport')
let as = require('../src/aerospike');

var Recaptcha = require('express-recaptcha').Recaptcha;
recaptcha = new Recaptcha("6LeXUIwUAAAAAMDSKM4DsbEW7V0e05BcA7df1bv7", "6LeXUIwUAAAAAE-J4bfyCM9hw9M4o6a1McdWIGFd", {'theme':'dark'});

router.get('/', function (req, res, next) {
    if (req.cookies.logged_in == "true") {
        res.redirect('/admin')
    } else {
        res.render('login.html', {settings: settings, captcha:recaptcha.render()})
    }
});

router.post('/', recaptcha.middleware.verify, passport.authenticate('local', {failureRedirect: '/login'}), function (req, res, next) {
  recaptcha.verify(req, function(error, data){
    if (!req.recaptcha.error) {
      as.getUser(req.body.uname, function (result) {
          if (result.bins.pass == req.body.pass) {
              res.cookie("logged_in", true);
              req.cookies.logged_in = true;
              res.redirect('/admin')
          } else {
              res.render('login.html', {settings: settings, failed: true})
          }
      });
    } else {
    res.render('login.html', {settings: settings, failed: true});
    }
  });
});

module.exports = router;