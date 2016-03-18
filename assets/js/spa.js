var myApp = angular.module('votingApp', ['ngRoute', 'chart.js', '720kb.socialshare', 'satellizer', 'toastr', 'ngCookies']);

myApp.config(['$routeProvider', '$locationProvider', '$authProvider', function($routeProvider, $locationProvider, $authProvider) {
    $locationProvider.html5Mode(true);
    $routeProvider
        .when('/polls', {
            templateUrl: 'partial/polls',
            controller: 'votingAppController'
        })
        .when('/polls/:url', {
            templateUrl: function(urlattr) {
                return 'partial/polls/' + urlattr.url;
            },
            controller: 'pollItemController'
        })
        .when('/newpoll', {
            templateUrl: 'partial/newpoll',
            controller: 'newPollController',
            resolve: {
                loginRequired: ['$q', '$location', '$auth', function($q, $location, $auth) {
                    var deferred = $q.defer();
                    if ($auth.isAuthenticated()) {
                        deferred.resolve();
                    }
                    else {
                        $location.path('/polls');
                    }
                    return deferred.promise;
                }]
            }
        })
        .when('/mypolls', {
            templateUrl: 'partial/mypolls',
            controller: 'myPollController',
            resolve: {
                loginRequired: ['$q', '$location', '$auth', function($q, $location, $auth) {
                    var deferred = $q.defer();
                    if ($auth.isAuthenticated()) {
                        deferred.resolve();
                    }
                    else {
                        $location.path('/polls');
                    }
                    return deferred.promise;
                }]
            }
        })
        .when('/logout', {
            template: null,
            controller: 'logoutController'
        })
        .otherwise({
            redirectTo: '/polls'
        });

    $authProvider.twitter({
        url: '/auth/twitter',
        authorizationEndpoint: 'https://api.twitter.com/oauth/authenticate',
        redirectUri: window.location.origin + '/auth/twitter/callback',
        type: '1.0',
        popupOptions: {
            width: 495,
            height: 645
        }
    });

    // var loginRequired = ['$q', '$location', '$auth', function($q, $location, $auth) {
    //     var deferred = $q.defer();
    //     if ($auth.isAuthenticated()) {
    //         deferred.resolve();
    //     }
    //     else {
    //         $location.path('/polls');
    //     }
    //     return deferred.promise;
    // }];
}]);

// Share the poll data between views
myApp.factory('pollFactory', ['$http', '$cookies', function($http, $cookies) {
    var pollFactory = {};

    pollFactory.findAll = function() {
        return $http.get('/pollAll');
    };

    pollFactory.findMyPoll = function(userId) {
        return $http.get('/mypolls', {
            params: {
                userId: userId
            }
        });
    };

    pollFactory.findOne = function(url) {
        return $http.get(url);
    };

    pollFactory.createPoll = function(data) {
        return $http.post('/createPoll', data);
    };

    pollFactory.updatePoll = function(url, data) {
        return $http.put(url, data);
    };

    pollFactory.deletePoll = function(url) {
        return $http.delete(url);
    };

    pollFactory.checkIp = function() {
        return $http.get('https://ipv4.myexternalip.com/json')
            .then(function(result) {
                return result.data.ip;
            });
    }

    return pollFactory;
}]);

// Login Controller
myApp.controller('loginController', ['$scope', '$auth', 'toastr', '$location', 'pollFactory', '$cookies', function($scope, $auth, toastr, $location, pollFactory, $cookies) {
    $scope.authenticate = function(provider) {
        $auth.authenticate(provider)
            .then(function(response) {
                toastr.success('You have successfully signed in with ' + provider + '!');
                $cookies.put('userId', response.data.userId);
                $location.path('/');
            })
            .catch(function(error) {
                if (error.error) {
                    // Popup error - invalid redirect_uri, pressed cancel button, etc.
                    toastr.error(error.error);
                }
                else if (error.data) {
                    // HTTP response error from server
                    toastr.error(error.data.message, error.status);
                }
                else {
                    toastr.error(error);
                }
            });
    };

}]);

myApp.controller('logoutController', ['$location', '$auth', 'toastr', function($location, $auth, toastr) {
    if (!$auth.isAuthenticated()) {
        return;
    }
    $auth.logout()
        .then(function() {
            toastr.info('You have been logged out');
            $location.url('/');
        });
}]);


// Navbar Controller
myApp.controller('authenticatedController', ['$scope', '$auth', function($scope, $auth) {
    $scope.isAuthenticated = function() {
        return $auth.isAuthenticated();
    };
}]);


// For main polls view
myApp.controller('votingAppController', ['$scope', 'pollFactory', function($scope, pollFactory) {
    // Show all polls
    pollFactory.findAll()
        .then(function(response) {
            $scope.polls = response.data;
        }, function(err) {
            $scope.error = err;
        });
}]);

// For my polls view
myApp.controller('myPollController', ['$scope', 'pollFactory', '$cookies', function($scope, pollFactory, $cookies) {
    // Show my polls
    var userId = $cookies.get('userId');

    pollFactory.findMyPoll(userId)
        .then(function(response) {
            $scope.polls = response.data;
        }, function(err) {
            $scope.error = err;
        });
}]);

// For new poll view
myApp.controller('newPollController', ['$scope', '$location', '$cookies', '$window', 'pollFactory', function($scope, $location, $cookies, $window, pollFactory) {
    // Generate a random number for slug url
    var getRandomNumber = function() {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < 5; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        return text;
    };

    // Create a new poll
    $scope.createPoll = function() {
        var getVotes = function() {
            var voteArr = [];
            for (var i = 0; i < $scope.options.length; i++) {
                voteArr[i] = 0;
            }
            return voteArr;
        };

        var poll = {
            title: $scope.title,
            options: $scope.options,
            votes: getVotes(),
            url: getRandomNumber(),
            owner: $cookies.get('userId')
        };

        if (!$scope.title) {
            $window.alert('You need a poll title!');
        }
        else if ($scope.options.length <= 1) {
            $window.alert('You need 2 or more options!');
        }
        else {
            pollFactory.createPoll(poll)
                .then(function successCallback(response) {
                    // Redirect to new poll page
                    $location.url('/polls/' + poll.url);
                });
        }
    };
}]);

// For poll item view
myApp.controller('pollItemController', ['$scope', '$routeParams', '$window', '$location', 'pollFactory', '$auth', '$cookies', function($scope, $routeParams, $window, $location, pollFactory, $auth, $cookies) {

    var url = '/polls/' + $routeParams.url;

    // Display the default text on select form
    $scope.selectedOption = null;

    // Get the poll data
    pollFactory.findOne(url)
        .then(function(response) {
            var poll = response.data;
            $scope.poll = poll;

            // Only show delete and custom option for owner
            $scope.isOwner = function() {
                return poll.owner === $cookies.get('userId');
            };

            // Chart data
            $scope.labels = poll.options;
            $scope.data = poll.votes;

            // Check IP Address
            pollFactory.checkIp()
                .then(function(result) {
                    $cookies.put('ipAddress', result);
                });

        });


    // ==========================================
    // Update the poll result
    // ==========================================
    $scope.updatePoll = function() {
        var vote = {};

        // Check if user logined or not
        if (!$auth.isAuthenticated()) {

            // Send ipAddress of non-login user to backend
            vote.voter = $cookies.get('ipAddress');
        }
        else {
            // Send userId to backend
            vote.voter = $cookies.get('userId');
        }

        // Custom Option
        if ($scope.selectedOption === 'customOption') {
            vote.selectedOption = $scope.ownOption;
        }
        // Existing options
        else {
            vote.selectedOption = $scope.selectedOption;
        }

        // Send all to server
        pollFactory.updatePoll(url, vote)
            .then(function(response) {
                if (response.data.message) {
                    $window.alert(response.data.message);
                }
                else {
                    $window.alert('You\'ve voted for ' + vote.selectedOption);
                    // Reset the value of form
                    $scope.selectedOption = null;
                    $scope.ownOption = null;
                    // Change the value of chart
                    $scope.labels = response.data[0].options;
                    $scope.data = response.data[0].votes;
                }
            }, function(err) {
                $scope.error = err;
            });
    };


    // Delete the poll
    $scope.deletePoll = function() {
        if ($window.confirm('Are you sure to remove this poll?')) {
            pollFactory.deletePoll(url)
                .then(function(res) {
                    $window.alert('Remove successfully!');
                    $location.url('/');
                }, function(err) {
                    $scope.error = err;
                });
        }
        else {
            $location.url(url);
        }
    };

    // Authentication
    $scope.isAuthenticated = function() {
        return $auth.isAuthenticated();
    };

}]);
