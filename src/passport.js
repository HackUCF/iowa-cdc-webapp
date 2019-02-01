const passport      = require('passport')
const as            = require('./aerospike')
const passportJWT   = require("passport-jwt")
const JWTStrategy   = passportJWT.Strategy
const ExtractJWT    = passportJWT.ExtractJwt
const LocalStrategy = require('passport-local').Strategy

var JwtStrategy     = require('passport-jwt').Strategy
var ExtractJwt      = require('passport-jwt').ExtractJwt
var opts = {}

passport.serializeUser((user, done) => {
    done(null, (String)(user['bins'].username))
})

passport.deserializeUser((id, done) => {
    as.getUser(id, (err, user) => {
        done(err, user)
    })
})

passport.use(new JWTStrategy({
    secretOrKey: env.JWT_SIGNING_KEY,
    jwtFromRequest: req => req.cookies['auth_token'],
},
    function (jwtPayload, cb) {
        console.table(jwtPayload)
        //find the user in db if needed. This functionality may be omitted if you store everything you'll need in JWT payload.
        return as.getUser(jwtPayload.sub)
            .then(user => {
                return cb(null, user);
            })
            .catch(err => {
                return cb(err);
            });
    }
));

passport.use(new LocalStrategy({
        usernameField: 'uname',
        passwordField: 'pass'
    },
    function (username, password, done) {
        //this one is typically a DB call. Assume that the returned user object is pre-formatted and ready for storing in JWT
        return as.getUser(username, (err, user) => {
            if(err){
                done(err)
            }
            if (!user || user['bins'] === undefined || user['bins'].username === undefined || user['bins'].password != password) {
                return done(null, false, {message: 'Incorrect username or password.'});
            }
            return done(null, user, {message: 'Logged In Successfully'});
        })
    }
));
