let router = require('express').Router();

router.get('/', function (req, res, next) {
    res.json(settings)
});
router.post('/', function (req, res, next) {
    settings = req.body;
    res.json(settings)
});

module.exports=router;