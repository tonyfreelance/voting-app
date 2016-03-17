/**
 * AuthController
 *
 * @description :: Server-side logic for managing auths
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var passport = require("passport");

module.exports = {

    /*
     |--------------------------------------------------------------------------
     | Server-side Authentication
     |--------------------------------------------------------------------------
     */
    // login: function(req, res) {

    //     passport.authenticate('local', function(err, user, info) {
    //         if ((err) || (!user)) {
    //             return res.send({
    //                 message: info.message
    //             });
    //         }
    //         req.logIn(user, function(err) {
    //             if (err) res.send(err);
    //             return res.redirect('/')
    //         });

    //     })(req, res);
    // },

    // logout: function(req, res) {
    //     req.logout();
    //     res.redirect('/');
    // },

    // twitter: function(req, res) {
    //     passport.authenticate('twitter', function(err, user, info) {
    //         if ((err) || (!user)) {
    //             return res.send({
    //                 message: info.message
    //             });
    //         }
    //         req.logIn(user, function(err) {
    //             if (err) res.send(err);
    //             return res.send({
    //                 message: info.message,
    //                 user: user
    //             });
    //         });
    //     })(req, res);
    // }
};
