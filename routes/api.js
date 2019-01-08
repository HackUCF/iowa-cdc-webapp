var express = require('express');
var router = express.Router();
let pos = require('./pos')

let routes = require("../api_list");

router.get('/',function(req, res, next) {
    console.log(req.cookies)
    res.render('api.html', {settings: settings, routes:routes.endpoints});
});

router.use('/pos', require("./pos"));

module.exports = router;