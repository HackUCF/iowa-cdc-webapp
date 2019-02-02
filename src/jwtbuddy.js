const jwtlib = require('jsonwebtoken');
var as = require('./aerospike');

const PRIVILEGE_LEVELS = {
	"admin": 4,
	"financier": 3,
	"developer": 2,
	"atm": 1,
	"logged_in": 0,
	"unauthenticated": -1,
};
module.exports.levels = PRIVILEGE_LEVELS;

const LIFESPAN = 5 * 60 * 1000;
module.exports.lifespan = LIFESPAN;

module.exports.issue = function(username, group){
	return jwtlib.sign({'sub': username, 'group': group}, env.JWT_SIGNING_KEY, options={expiresIn: LIFESPAN});
};

var decode = function(jwt){
	try {
		let decoded = jwtlib.verify(jwt, env.JWT_SIGNING_KEY);
		return decoded;
	}
	catch(err) {
		logger.error("Error while validating JWT: " + err);
		return {'sub': "", 'group': -1};
	}
};

module.exports.blacklist = function(jwt, callback){
	as.addBlacklistedJWT(jwt, function(err){
		callback(err);
	});
};

var isValid = function(jwt, callback){
	as.checkJWTBlacklist(jwt, function(error, inBlacklist){
		if(error){
			logger.error("Error checking JWT blacklist.");
			callback(false);
		}
			
		if(inBlacklist){
			logger.error("Attempted to validate a blacklisted JWT.");
			callback(false);
		}
		if(PRIVILEGE_LEVELS[decode(jwt).group] < 0){
			logger.error("Attempted to validate JWT with less than minimal authorization.");
			callback(false);
		}
		
		callback(true);
	});
};

var getUserName = function(jwt) {
	return decode(jwt).sub;
};
module.exports.getUserName = getUserName;

var getPrivLevel = function(jwt) {
	return PRIVILEGE_LEVELS[decode(jwt).group];
};
module.exports.getPrivLevel = getPrivLevel;

module.exports.checkAuthorization = function(requiredLevel){
    return function(req, res, next){
        if(req.cookies.session){
            isValid(req.cookies.session, function(validated){
                if(validated && getPrivLevel(req.cookies.session) >= requiredLevel)
                    return next();
                else
                    res.status(401).end();
            })
        } else if (requiredLevel <= 0){
            return next();
        } else {
            res.status(401).end();
        }
    }
};
