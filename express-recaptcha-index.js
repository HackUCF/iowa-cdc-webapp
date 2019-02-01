"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var https = __importStar(require("https"));
var http = __importStar(require("http"));
var request = __importStar(require("request"));
var Recaptcha = (function () {
    function Recaptcha(site_key, secret_key, options) {
        this._api = {
            host: 'www.google.com',
            script: '/recaptcha/api.js',
            verify: '/recaptcha/api/siteverify'
        };
        this._site_key = site_key;
        this._secret_key = secret_key;
        this._options = options || { checkremoteip: false };
        if (!this._site_key)
            throw new Error('site_key is required');
        if (!this._secret_key)
            throw new Error('secret_key is required');
    }
    Object.defineProperty(Recaptcha.prototype, "middleware", {
        get: function () {
            var _this = this;
            return {
                render: function (req, res, next) {
                    res.recaptcha = _this.render();
                    next();
                },
                renderWith: function (optionsToOverride) {
                    var self = _this;
                    return function (_req, _res, _next) {
                        _res.recaptcha = self.renderWith(optionsToOverride);
                        _next();
                    };
                },
                verify: function (req, res, next) {
                    _this.verify(req, function (error, data) {
                        req.recaptcha = { error: error, data: data };
                        next();
                    });
                }
            };
        },
        enumerable: true,
        configurable: true
    });
    Recaptcha.prototype.render = function () {
        return this.renderWith({});
    };
    Recaptcha.prototype.renderWith = function (optionsToOverride) {
        var query_string = '';
        var captcha_attr = '';
        var options = Object.assign({}, this._options, optionsToOverride);
        if (options.onload)
            query_string += '&onload=' + options.onload;
        if (options.render)
            query_string += '&render=' + options.render;
        if (options.hl)
            query_string += '&hl=' + options.hl;
        if (options.theme)
            captcha_attr += ' data-theme="' + options.theme + '"';
        if (options.type)
            captcha_attr += ' data-type="' + options.type + '"';
        if (options.callback)
            captcha_attr += ' data-callback="' + options.callback + '"';
        if (options.expired_callback)
            captcha_attr += ' data-expired-callback="' + options.expired_callback + '"';
        if (options.size)
            captcha_attr += ' data-size="' + options.size + '"';
        if (options.tabindex)
            captcha_attr += ' data-tabindex="' + options.tabindex + '"';
        query_string = query_string.replace(/^&/, '?');
        return '<script src="//' + this._api.host + this._api.script + query_string + '" async defer></script>' +
            '<div class="g-recaptcha" data-sitekey="' + this._site_key + '"' + captcha_attr + '></div>';
    };
    Recaptcha.prototype.verify = function (req, cb) {
        var response = null;
        var post_options = null;
        if (!req)
            throw new Error('req is required');
        if (req.body && req.body['g-recaptcha-response'])
            response = req.body['g-recaptcha-response'];
        if (req.query && req.query['g-recaptcha-response'])
            response = req.query['g-recaptcha-response'];
        if (req.params && req.params['g-recaptcha-response'])
            response = req.params['g-recaptcha-response'];
        var query_string = 'secret=' + this._secret_key + '&response=' + response;
        if (this._options.checkremoteip) {
            var remote_ip = req.headers && req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'] : req.connection.remoteAddress;
            if (remote_ip)
                query_string += '&remoteip=' + remote_ip;
        }
        post_options = {
            proxy: 'http://199.100.16.100:3128',
            url: 'https://' + this._api.host + this._api.verify,
            method: 'POST',
            body: query_string,
	          rejectUnauthorized: false,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(query_string)
            }
        };
        request.post(post_options, function (err, res, body) {
                var result = JSON.parse(body);
                var error = result['error-codes'] && result['error-codes'].length > 0 ? result['error-codes'][0] : 'invalid-input-response';
                if (result.success) {
                    cb(null, { hostname: result.hostname });
                }
                else {
                    cb(error, null);
                }
        });
    };
    return Recaptcha;
}());
exports.Recaptcha = Recaptcha;
