const { exec } = require('child_process');

module.exports.make_pretty = function (object, callback) {
    callback(JSON.stringify(object, null, 4))
};

module.exports.deep_search = function (search, callback) {
    logger.info("deep_search called with: [" + search + "] (lol)");
    exec(search, (err, a, b) =>{
            callback(a, b)
    })
};
