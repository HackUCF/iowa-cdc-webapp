const passport      = require('passport');
const as            = require('./aerospike');
const LocalStrategy = require('passport-local').Strategy;
const crypto        = require('crypto');
const bcrypt        = require('bcrypt');
var opts = {}

passport.serializeUser((user, done) => {
    done(null, (String)(user['bins'].username))
})

passport.deserializeUser((id, done) => {
    as.getUser(id, (err, user) => {
        done(err, user)
    })
})

passport.use(new LocalStrategy({
        usernameField: 'uname',
        passwordField: 'pass',
        passReqToCallback: true // per https://github.com/jaredhanson/passport-local/blob/master/lib/strategy.js#L26
    },
    function (req, username, password, done) {
        //this one is typically a DB call. Assume that the returned user object is pre-formatted and ready for storing in JWT
        clientAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        return as.getUser(username, (err, user) => {
            if(err){
                done(err)
            }
            if (!user || user.bins === undefined || user.bins.username === undefined){
                banmi.recordFailure(clientAddr);
                return done(null, false, {message: 'Incorrect username or password.'});
            }
            
            bcrypt.compare(env.PASSWORD_SALT + password, user.bins.password).then(function(res) {
              if(res === true){
                banmi.deleteBanRecord(clientAddr);
                return done(null, user, {message: 'Logged In Successfully'});
              } else {
                banmi.recordFailure(clientAddr);
                return done(null, false, {message: 'Incorrect username or password.'});
              }
            });
        });
    }
));
