let express = require('express');
let router = express.Router();
let as = require('../src/aerospike');
let request = require('request');


router.get('/num/:account_number', function (req, res, next) {
    as.getAccount(req.params.account_number, function (err, rec) {
        if (err){
            res.render("error.html", {error: err})
        } else {
            res.render("account.html", {account: rec})
        }
    })
});
router.post('/route', function (req, res, next) {
    res.redirect('/account/num/'+req.body.num)
});

router.post('/num/:account_number', function (req, res, next) {
    as.getAccount(req.params.account_number, function (err, rec) {
        if (err){
            res.render("error.html", {error: err})
        } else {
            res.render("account.html", {account: rec})
        }
    })
});
router.get('/', function (req, res, next) {
    /*as.getAllAccounts(function (err, all) {
        if(err){
            res.send(err);
        }else{
            res.json({all: all})
        }
    })*/
    
    res.json({all: {}});
});

router.post('/del/:account_number', function (req, res, next) {
    request.delete({
        baseUrl: settings.P9_2_json.ip,
        uri: '/acct.cgi',
        qs:{
            bank: settings.team,
            acct: req.params.account_number
        }
    }, function () {
        logger.debug('DELETE_ACCOUNT: Deleted account ' + req.params.account_number);
    });
    as.delete_acct(req.params.account_number, function () {
        res.redirect('/')
    })
});
module.exports = router;
