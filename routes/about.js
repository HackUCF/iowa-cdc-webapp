let express = require('express');
let router = express.Router();
let as = require('../src/aerospike');

var Recaptcha = require('express-recaptcha').Recaptcha;
recaptcha = new Recaptcha(env.CAPTCHA_SITE, env.CAPTCHA_SECRET, {'theme': 'dark'});

router.post('/', recaptcha.middleware.verify, function(req, res, next) {
    if (!req.recaptcha.error) {
        if (!req.body.set || (req.body.set !== "propaganda" && req.body.set !== "comments"))
            req.body.set = "comments";

        as.addComment(function() {
            logger.info("Commenter ID " + req.body.uname + " successfully completed the captcha and posted a comment at [" + new Date().toISOString() + "]");
            res.redirect('/about/' + req.body.set);
        }, req.body.set, {
            uname: req.body.uname,
            comment: req.body.comment
        });
    } else {
        logger.error("Commenter ID " + req.body.uname + " failed to post a comment [" + new Date().toISOString() + "]");
        res.redirect('/error/');
    }
});

router.get('/:set?', function(req, res, next) {
    if (!req.params.set || (req.params.set !== "propaganda" && req.params.set !== "comments"))
        req.params.set = "comments";

    as.getComments(function(err, comments) {
        res.render('about.html', {
            settings: settings,
            comments: comments,
            set: req.params.set,
            captcha_sitekey: env.CAPTCHA_SITE,
            captcha: recaptcha.render(),
        });
    }, req.params.set);
});


module.exports = router;
