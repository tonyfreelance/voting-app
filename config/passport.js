var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    TwitterStrategy = require("passport-twitter").Strategy,
    bcrypt = require('bcrypt');

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findOneById(id).exec(function(err, user) {
        done(err, user);
    });
});

// passport.use(new LocalStrategy({
//         usernameField: 'email',
//         passwordField: 'password'
//     },
//     function(email, password, done) {
//         User.findOne({
//             email: email
//         }).exec(function(err, user) {
//             if (err) {
//                 return done(err);
//             }
//             if (!user) {
//                 return done(null, false, {
//                     message: 'Unknown user ' + email
//                 });
//             }
//             if (user.password != password) {
//                 return done(null, false, {
//                     message: 'Invalid password'
//                 });
//             }

//             bcrypt.compare(password, user.password, function(err, res) {
//                 if (!res)
//                     return done(null, false, {
//                         message: 'Invalid Password'
//                     });
//                 var returnUser = {
//                     email: user.email,
//                     createdAt: user.createdAt,
//                     id: user.id
//                 };
//                 return done(null, returnUser, {
//                     message: 'Logged In Successfully'
//                 });
//             });
//         });
//     }
// ));

// For Twitter authentication
passport.use(new TwitterStrategy({
        consumerKey: 'wxf1f5PnsLbGfidQ74zvHSS6C',
        consumerSecret: '7082Zh8NASUQdKfCe4AC5Y1gnU8HFj0fp2NqOoMd8yT5hUvQtv',
        callbackURL: 'https://sails-test-tonyfreelance-1.c9users.io/auth/twitter/callback',
    },
    function(token, tokenSecret, profile, done) {
        process.nextTick(function() {
           User.findOne({
               id: profile.id
           }, function(err, existingUser) {
               if(err) {
                   return done(err);
               }
               if(existingUser) {
                   return done(null, existingUser);
               } else {
                   var newUser = {
                     id: profile.id,
                     token: token,
                     displayName: profile.displayName,
                     username: profile.username
                   };
                   
                   User.create(newUser, function(err, user) {
                      if(err) sails.log(err);
                      return done(null, user);
                   });
               }
           }); 
        });
    }));