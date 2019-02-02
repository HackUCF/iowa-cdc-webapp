var path         = require('path');
var express      = require('express');
let fs           = require('fs');
const nunjucks   = require("nunjucks");
var path         = require('path');
var cookieParser = require('cookie-parser');
var createError  = require('http-errors');
let winston      = require('winston');
var app_logger   = require('morgan');
var passport     = require('passport');
const buddy = require('../src/jwtbuddy');

global.settings = require('./settings');
global.env = process.env;
global.as_settings = require('./as_settings');
global.logger = winston.createLogger({
    level: 'silly',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({filename: './logs/error.log', level: 'error'}),
        new winston.transports.File({filename: './logs/combined.log'})
    ]
});

var logStream = fs.createWriteStream(path.join(__dirname, 'logs/access.log'), {flags: 'a'});
var lm = {};
lm.phrase = function(){return "";};
settings.lm = lm;

var as = require('./src/aerospike');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
let search_router = require('./routes/search');
let api_router = require("./routes/api");
let init = require("./src/init_session");
var flash = require('connect-flash');

var app = express();

let njenv = new nunjucks.Environment(new nunjucks.FileSystemLoader('views', {watch: true}), {
    autoescape: true,
    trimBlocks: true,
    lstripBlocks: true
});
njenv.addGlobal("settings", settings).express(app);

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
require('./src/passport')
app.use(flash());

app.use(app_logger('common', {
    stream: logStream
}));
app.use(app_logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
    extended: false
}));
app.use(cookieParser());

app.use(init);
app.use(express.static(path.join(__dirname, '/public')));
app.use('/', indexRouter);
app.use('/search', search_router.search());
app.use('/api', api_router);
app.use('/login', require("./routes/login"));
app.use('/careers', require("./routes/now_hiring"));
app.use('/about', require('./routes/about'));
app.use('/admin', buddy.checkAuthorization(buddy.levels.financier), require("./routes/admin"));
app.use('/account', buddy.checkAuthorization(buddy.levels.financier), require('./routes/account'));
app.use('/users', buddy.checkAuthorization(buddy.levels.financier), usersRouter);
app.use('/schedule', buddy.checkAuthorization(buddy.levels.developer), require('./routes/sched'));
app.use('/settings', buddy.checkAuthorization(buddy.levels.developer), require('./routes/settings'));
app.use('/test', buddy.checkAuthorization(buddy.levels.developer), require('./routes/test'));
app.use('/logout', buddy.checkAuthorization(buddy.levels.logged_in), require('./routes/logout'));
//app.use('/truncate', buddy.checkAuthorization(buddy.levels.admin), as.truncate);

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(winston.format.colorize(), winston.format.simple())
    }));
}

app.use(function (req, res, next) {
    next(createError(404));
});

app.use(function (err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = err;
    logger.error(err);
    logger.error(JSON.stringify({
        level: err.level,
        message: err.message,
        stack: err.stack
    }, null, 4))
    res.status(err.status || 450);
    res.render('error.html', {
        settings: settings,
        error: ""
    });
});

module.exports = app;
