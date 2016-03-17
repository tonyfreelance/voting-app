/**
 * UserController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var request = require('request');
var qs = require("querystring");
var moment = require('moment');
var jwt = require('jwt-simple');


module.exports = {

    _config: {
        actions: false,
        shortcuts: false,
        rest: false
    },

    /*
     |--------------------------------------------------------------------------
     | Client-side Authentication
     |--------------------------------------------------------------------------
     */
    twitter: function(req, res) {
        var requestTokenUrl = 'https://api.twitter.com/oauth/request_token';
        var accessTokenUrl = 'https://api.twitter.com/oauth/access_token';
        var profileUrl = 'https://api.twitter.com/1.1/users/show.json?screen_name=';
        var tokenSecret = sails.config.twitter.tokenSecret;

        // Part 1 of 2: Initial request from Satellizer.
        if (!req.body.oauth_token || !req.body.oauth_verifier) {
            var requestTokenOauth = {
                consumer_key: sails.config.twitter.consumer_key,
                consumer_secret: sails.config.twitter.consumer_secret,
                callback: sails.config.twitter.callback
            };

            // Step 1. Obtain request token for the authorization popup.
            request.post({
                url: requestTokenUrl,
                oauth: requestTokenOauth
            }, function(err, response, body) {
                var oauthToken = qs.parse(body);

                // Step 2. Send OAuth token back to open the authorization screen.
                res.send(oauthToken);
            });
        }
        else {
            // Part 2 of 2: Second request after Authorize app is clicked.
            var accessTokenOauth = {
                consumer_key: sails.config.twitter.consumer_key,
                consumer_secret: sails.config.twitter.consumer_secret,
                token: req.body.oauth_token,
                verifier: req.body.oauth_verifier
            };

            // Step 3. Exchange oauth token and oauth verifier for access token.
            request.post({
                url: accessTokenUrl,
                oauth: accessTokenOauth
            }, function(err, response, accessToken) {

                accessToken = qs.parse(accessToken);

                var profileOauth = {
                    consumer_key: sails.config.twitter.consumer_key,
                    consumer_secret: sails.config.twitter.consumer_secret,
                    oauth_token: accessToken.oauth_token
                };

                // Step 4. Retrieve profile information about the current user.
                request.get({
                    url: profileUrl + accessToken.screen_name,
                    oauth: profileOauth,
                    json: true
                }, function(err, response, profile) {
                    if (err) return res.negotiate(err);

                    // Step 5. Create a new user account or return an existing one.
                    User.findOne({
                        twitter: profile.id.toString()
                    }).exec(function(err, existingUser) {
                        if (err) {
                            sails.log(err);
                            return res.negotiate(err);
                        }
                        // if (existingUser)
                        //     sails.log(existingUser);
                        // sails.log(profile.id);

                        // return res.ok();


                        if (existingUser) {
                            return res.send({
                                userId: existingUser.id,
                                token: createJWT(existingUser)
                            });
                        }

                        var user = {
                            twitter: profile.id,
                            displayName: profile.name
                        };

                        User.create(user, function(err, result) {
                            if (err)
                                return res.negotiate(err);
                            res.send({
                                userId: result.id,
                                token: createJWT(result)
                            });
                        });
                    });
                });
            });
        }

        /*
         |--------------------------------------------------------------------------
         | Generate JSON Web Token
         |--------------------------------------------------------------------------
         */
        function createJWT(user) {
            var payload = {
                sub: user.id,
                iat: moment().unix(),
                exp: moment().add(14, 'days').unix()
            };
            return jwt.encode(payload, tokenSecret);
        }
    },

    twitterCallback: function(req, res) {
        return res.ok();
    },

    myPolls: function(req, res) {
        var userId = req.query.userId;
        if (userId) {
            User.find({
                    id: userId
                })
                .populate('polls')
                .exec(function(err, results) {
                    if (err) return res.negotiate(err);
                    if (!results) {
                        return res.notFound();
                    }
                    return res.send(results[0].polls);
                });
        }
        else {
            return res.redirect('/mypolls');
        }
    },
};
