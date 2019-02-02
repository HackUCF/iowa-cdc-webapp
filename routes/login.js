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
        res.render('login.html', {
            settings: settings,
            captcha: recaptcha.render(),
            captcha_sitekey: env.CAPTCHA_SITE,
        });
    }
});

router.post('/', function (req, res, next) {
    passport.authenticate('local', {session: false}, (err,user,info) => {
        console.log(info)
        if(err) { return next(err); }
        if (!user) { return res.redirect('/login')}
        res.cookies.session = buddy.issue(user.username, user.group);
        res.redirect("/");
    })(req,res);
});

module.exports = router;
