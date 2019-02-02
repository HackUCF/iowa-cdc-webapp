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
        passwordField: 'pass'
    },
    function (username, password, done) {
        //this one is typically a DB call. Assume that the returned user object is pre-formatted and ready for storing in JWT
        return as.getUser(username, (err, user) => {
            if(err){
                done(err)
            }
            if (!user || user.bins === undefined || user.bins.username === undefined)
                return done(null, false, {message: 'Incorrect username or password.'});
                
            bcrypt.compare(env.PASSWORD_SALT + password, user.bins.password).then(function(res) {
              if(res === true)
                return done(null, user, {message: 'Logged In Successfully'});
              else
                return done(null, false, {message: 'Incorrect username or password.'});
            });
        });
    }
));
