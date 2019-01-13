let express = require('express')
let router = express.Router()
let as = require('../src/aerospike')


router.get('/aerospike', function (req, res, next) {
    as.test();
    res.redirect('/')
});

module.exports = router;