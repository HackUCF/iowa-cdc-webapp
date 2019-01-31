var express = require('express');
var router = express.Router();
const jwt = require('jsonwebtoken');
var passport = require('passport')

var Recaptcha = require('express-recaptcha').Recaptcha;
recaptcha = new Recaptcha("6LeXUIwUAAAAAMDSKM4DsbEW7V0e05BcA7df1bv7", "6LeXUIwUAAAAAE-J4bfyCM9hw9M4o6a1McdWIGFd", {
    'theme': 'dark'
});

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
    })
    (req,res);
});

module.exports = router;
