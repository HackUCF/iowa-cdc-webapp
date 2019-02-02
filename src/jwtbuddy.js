const jwt = require('jsonwebtoken');
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
module.exports.issue = function(username, group){
	return jwt.sign({'sub': username, 'group': group}, env.JWT_SIGNING_KEY, options={expiresIn: LIFESPAN});
};

var decode = function(jwt){
	try {
		let decoded = jwt.verify(jwt, env.JWT_SIGNING_KEY);
		return decoded;
	}
	catch(err) {
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
		if(error)
			callback(false);
			
		if(inBlacklist)
			callback(false);
		
		if(decode(jwt).group == -1)
			callback(false);
	
		callback(true);
	});
};

var getPrivLevel = function(jwt) {
	return PRIVILEGE_LEVELS[decode(jwt).group];
};

module.exports.checkAuthorization = function(requiredLevel){
	return function(req, res, next){
		if(req.cookies.session){
			isValid(req.cookies.session, function(validated){
				if(validated && getPrivLevel(req.cookies.session) >= requiredLevel)
					next();
				else
					res.sendStatus(403);
			})
		} else if (requiredLevel <= 0){
			next();
		} else {
			res.send_status(403);
		}
	}
};
