var express = require('express');
var router = express.Router();
var passport = require('passport')
let as = require('../src/aerospike');


router.get('/',
    function (req, res, next) {
        // if (req.cookies.logged_in == "true") {
        //     res.redirect('/admin')
        // } else {
        res.render('login.html', {
            settings: settings
        })
        // }

    });
router.post('/', passport.authenticate('local', {
    failureRedirect: '/login'
}),
function (req, res) {
    res.redirect('/');
});


module.exports = router;