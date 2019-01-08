var express = require('express');
var router = express.Router();
let as = require('../src/aerospike');


router.get('/', function (req,res,next) {
    if(req.cookies.logged_in != "true"){
        res.redirect('/login')
    }
    else {
        res.render("admin.html", {settings: settings});
    }
});
router.get('/newAccount', function (req, res, next) {
    res.render('newAccount.html', {settings: settings})
});
router.post('/newAccount', function (req, res, next) {
    as.newAccount(req.body.account_number, req.body.owner, req.body.bal, req.body.pin);
    res.redirect("/account/num/" + req.body.account_number.toString())
});
router.get('/add', function (req, res, next) {
    res.render('add.html',{settings: settings})
});
router.post('/add', function (req, res, next) {
    as.addTransaction("add", req.body, function (err, result) {
        if (err){throw err}
        else {
            res.redirect('/account/num/'+req.body.account_number)
        }
    })
});
router.get('/transfer', function (req, res, next) {
    res.render('transfer.html', {settings: settings})
});
router.post('/transfer', function (req, res, next) {
    req.body.destination={account_number: req.body.dacct, branch: req.body.dbranch};
    as.addTransaction("transfer", req.body, function (err, result) {
        if (err){throw err}
        else {
            res.redirect('/account/num/'+req.body.account_number)
        }
    })
});

module.exports = router;