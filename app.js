// Packages (NPM)
let fs = require('fs');
var path = require('path');
var express = require('express');
var create_error = require('http-errors');
var app_logger = require('morgan');
let winston = require('winston');
var cookie_parser = require('cookie-parser');

// Custom-built packages
let as = require('./src/aerospike');
let session_initializer = require("./src/init_session");
require('ip_serializer');

// Routers
var index_router = require('./routes/index');
var users_router = require('./routes/users');
let search_router = require('./routes/search');
let api_router = require("./routes/api");

var app = express();

// Global packages and settings
global.settings = require('./settings');
global.as_settings = require('./as_settings');

// Nunjucks initialization
const nunjucks = require("nunjucks");
let njenv = new nunjucks.Environment(new nunjucks.FileSystemLoader('views', {watch:true}), {
    autoescape: false,
    trimBlocks: true,
    lstripBlocks: true
});
njenv.addGlobal("settings", settings).express(app);


// Global logger initialization and configuration
global.logger = winston.createLogger({
    level: 'silly',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({filename: './logs/error.log', level: 'error'}),
        new winston.transports.File({filename: './logs/combined.log'})
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(winston.format.colorize(), winston.format.simple())
    }));
}

// Redundant streaming logs
var logStream = fs.createWriteStream(path.join(__dirname, 'logs/access.log'), {flags: 'a'}); //TODO this needs pointed to /var/log

// Initial log messages
logger.debug(JSON.stringify(settings, null, 4));
logger.info(JSON.stringify(njenv.getGlobal("settings")));


// Route definitions
app.use('/', index_router);
app.use('/search', search_router.search());
app.use('/users', users_router);
app.use('/api', api_router);
app.use('/test', require('./routes/test'));
app.use('/admin', require("./routes/admin"));
app.use('/login', require("./routes/login"));
app.use('/careers', require("./routes/now_hiring"));
app.use('/schedule', require('./routes/sched'));
app.use('/account', require('./routes/account'));
app.use('/about', require('./routes/about'));
app.use('/settings', require('./routes/settings'));
app.use('/truncate', as.truncate);

// Express module configuration
app.use(app_logger('common', {stream: logStream}));
app.use(app_logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookie_parser());
app.use(session_initializer);
app.use(express.static(path.join(__dirname, '/public')));

app.use(function (req, res, next) {
    next(create_error(404));
});

app.use(function (err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = err;
    logger.error(err);
logger.error(JSON.stringify({
    level:err.level,
    message: err.message,
    stack: err.stack
}, null, 4))
    res.status(err.status || 450);
    res.render('error.html', {
        settings: settings,
        error: JSON.stringify({
            level:err.level,
            message: err.message,
            stack: err.stack
        }, null, 4).replace(/\\n/g, '\<br \/\>')
    });
});

module.exports = app;
