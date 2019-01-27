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

router.post('/', function (req, res) {
    passport.authenticate('local', {session: false}, (err,user,info) => {
        req.login(user, {session: false}, (err) => {
            var token = jwt.sign({'sub': user['bins'].a}, 'wHiTmAn_HaV3_a_H4l_Da1!_REEEE_5258ed9cb5d3e2d9daf8139df9880eba');
            res.cookie('auth_token', token, { maxAge: 1000000 });
            res.redirect('/')
        })
    })
    (req,res);
});

module.exports = router;