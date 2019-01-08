let express = require('express');
let router = express.Router();
let as = require('../src/aerospike');



router.get('/num/:account_number', function (req, res, next) {
    as.getAccount(req.params.account_number, function (err, rec) {
        if (err){
            res.render("error.html", {error: err})
        } else {
            res.render("account.html", {account: rec})
        }
    })
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
    as.getAllAccounts(function (err, all) {
        if(err){
            res.send(err);
        }else{
            res.json({all: all})
        }
    })
});

module.exports = router;