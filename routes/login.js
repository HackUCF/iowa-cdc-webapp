var express = require('express');
var router = express.Router();
const jwt = require('jsonwebtoken');
var passport = require('passport')

var Recaptcha = require('express-recaptcha').Recaptcha;
recaptcha = new Recaptcha(env.CAPTCHA_SITE, env.CAPTCHA_SECRET, {'theme': 'dark'});

router.get('/', function (req, res, next) {
    if (req.isAuthenticated()) {
        res.redirect('/');
    } else {
        res.render('login.html', {
            settings: settings,
            captcha: recaptcha.render()
        })
    }
});

router.post('/', function (req, res, next) {
    passport.authenticate('local', {session: false}, (err,user,info) => {
        console.log(info)
        if(err) { return next(err); }
        if (!user) { return res.redirect('/login')}
        return req.login(user,next)
    })(req,res);
});

module.exports = router;
