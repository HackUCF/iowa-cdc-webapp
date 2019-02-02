var express = require('express');
var router = express.Router();
const buddy = require('../src/jwtbuddy');
var passport = require('passport')

var Recaptcha = require('express-recaptcha').Recaptcha;
recaptcha = new Recaptcha(env.CAPTCHA_SITE, env.CAPTCHA_SECRET, {'theme': 'dark'});

router.get('/', function (req, res, next) {
    if (req.isAuthenticated()) {
        res.redirect('/');
    } else {
        clientAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        isBanned = banmi.isBanned(clientAddr);
        
        res.render('login.html', {
            settings: settings,
            show_captcha: isBanned,
            captcha: isBanned == true ? recaptcha.render() : null,
            captcha_sitekey: env.CAPTCHA_SITE,
        });
    }
});

router.post('/', function (req, res, next) {
    clientAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    isBanned = banmi.isBanned(clientAddr);
    
    if(isBanned){
      recaptcha.verify(req, function(error, data){
        if (!req.recaptcha.error) {
            passport.authenticate('local', {session: false}, (err,user,info) => {
                if(err) { return next(err); }
                if (!user) { return res.redirect('/login')};
                logger.info("User " + user['bins'].username + " successfully logged in and completed the captcha at [" + new Date().toISOString() + "]");
                res.cookie('session', buddy.issue(user['bins'].username, user['bins'].group), buddy.lifespan);
                res.redirect("/");
            })(req,res);
        } else {
          banmi.recordFailure(clientAddr);
          logger.error("Login attempt for " + req.body.uname + " stopped due to invalid captcha [" + new Date().toISOString() + "]");
          res.render('login.html', {settings: settings, failed: true});
        }
      });
    } else {
      passport.authenticate('local', {session: false}, (err,user,info) => {
          if(err) { return next(err); }
          if (!user) { return res.redirect('/login')}
          console.table(user)
          res.cookie('session', buddy.issue(user['bins'].username, user['bins'].group), buddy.lifespan);
          res.redirect("/");
      })(req,res);
    }
});

module.exports = router;
