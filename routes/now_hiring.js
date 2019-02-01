let express = require('express')
let router = express.Router()

router.get('/', function (req,res,next) {
    res.render("now_hiring.html", {settings: settings})
});

module.exports = router;