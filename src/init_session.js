module.exports = function (req, res, next) {
    if (!req.cookies.cdc_session) {
        res.cookie('last_activity', new Date().getTime());
        res.cookie('logged_in', false);
        res.cookie('admin', false);
        res.cookie('cdc_session', "Enabled");
    } else {
        res.cookie('last_activity', new Date().getTime())
    }
    next();
};