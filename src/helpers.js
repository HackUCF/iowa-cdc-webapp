const { exec } = require('child_process');

module.exports.make_pretty = function (object, callback) {
    callback(JSON.stringify(object, null, 4))
};

module.exports.deep_search = function (search, callback) {
    logger.info("Someone tried to run some commands: [" + search + "]");
    callback("No results found.", "");
    /*exec(search, (err, a, b) =>{
            callback(a, b)
    })*/
};
