var express = require('express');
var router = express.Router();
var multer = require('multer');
var unique = require('array-unique');
var upload = multer();
let helper = require('../src/helpers');
let fs = require('fs');
let cp = require('child_process');

module.exports.search = function search() {
    router.post('/', upload.any(), function (req, res, next) {
        if (!req.body.Search) {
            helper.make_pretty(req.body, function (resp) {
                logger.error(resp)
                throw {status: 451, message: "Boris can't search for nothing comrade"}
            })
        }
        quick_search(req.body.Search, (results) => {
            if (results) {
                res.render('search.html', {settings: settings, results: results})
            } else {
                //Handle no quick result
                helper.deep_search(req.body.Search, function (a, b) {
                    res.render('search.html', {
                        settings: settings,
                        search: {search: req.params.search_term, error: b, result: a}
                    })
                })
            }
        })
    });
    router.get('/:search_term/', function (req, res, next) {
        if (!req.params.search_term) {
            helper.make_pretty(req.body, function (resp) {
                logger.error(resp)
                throw {status: 451, message: "Boris can't search for nothing comrade"}
            })
        }
        quick_search(req.params.search_tearm, (results) => {
            if (results) {
                res.render('search.html', {settings: settings, results: results})
            } else {
                //Handle no quick result
                helper.deep_search(req.params.search_term, function (a, b) {
                    // res.send({Search: req.params.search_term, a: a, b: b})
                    res.render('search.html', {
                        settings: settings,
                        search: {search: req.params.search_term, error: b, result: a}
                    })
                })
            }
        })
    });
    router.get('/', function (req, res, next) {
        throw {status: 451, message: "Boris can't search for nothing comrade"}
    });
    return router;
};

function quick_search(query, callback) {
    var results = [];
    query = query.split(/[ ,]/);
    for (word of query) {
        switch (word.toLowerCase()) {
            case "api":
                results.push({text: "API References", link: "/api"});
                break;
            case "login":
                results.push({text: "Login page", link: "/login"});
                break;
            case "about":
                results.push({text: "More information", link: "/about"});
                break;
            case "logout":
                results.push({text: "Logout page", link: "/logout"});
                break;
            case "transfer":
                results.push({text: "Transfer funds", link: "/admin/transfer"});
                break;
            case "create":
                results.push({text: "Create a new account", link: "/admin/create"});
                break;
            case "deposit":
            case "withdraw":
            case "cash":
                results.push({text: "Add/Withdraw funds", link: "/admin/add"});
                break;
            case "account":
                results.push({test: "Account details", link:'account/num/1'});
                break;
            case "reserve":
                results.push({text: "Branch reserve details", link: 'account/num/0'});
                break;
            case "admin":
                results.push({text: "Admin page", link: "/admin"});
                break;
        }
    }
    if (results.length > 0) {
        callback(unique(results));
    } else {
        callback(null)
    }
}