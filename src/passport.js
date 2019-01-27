const passport      = require('passport')
const as            = require('./aerospike')
const passportJWT   = require("passport-jwt")
const JWTStrategy   = passportJWT.Strategy
const ExtractJWT    = passportJWT.ExtractJwt
const LocalStrategy = require('passport-local').Strategy

var JwtStrategy     = require('passport-jwt').Strategy
var ExtractJwt      = require('passport-jwt').ExtractJwt
var opts = {}
// opts.jwtFromRequest = req => req.cookies.jwt
// opts.secretOrKey = 'wHiTmAn_HaV3_a_H4l_Da1!_REEEE_5258ed9cb5d3e2d9daf8139df9880eba'
// opts.issuer = 'team4.isucdc.com';
// opts.audience = 'team4.isucdc.com';


passport.serializeUser((user, done) => {
    done(null, (String)(user['bins'].a))
})

passport.deserializeUser((id, done) => {
    as.getUser(id, (err, user) => {
        done(err, user)
    })
})

passport.use(new JWTStrategy({
    secretOrKey: '5258ed9cb5d3e2d9daf8139df9880eba',
    jwtFromRequest: req => req.cookies.auth_token,
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
            if (!user || user['bins'].b != password) {
                console.table(user)
                return done(null, false, {message: 'Incorrect username or password.'});
            }
            return done(null, user, {message: 'Logged In Successfully'});
        })
    }
));