/**
 * Created by Hplus on 02/10/2015.
 */

angular.module('trackerApp')
    .factory('Token', function($rootScope, $cookies, $http) {
        var tokenFactory = {};

        tokenFactory.GetLanguages = function(callback) {
            $http.get('/api/languages')
                .then(function(response) {
                    return callback(response.data.languages);
                },
                function(response) {
                    switch(response.status) {
                        case 400:
                        case 404:
                        case 500:
                            return callback(['en']);
                            break;
                    }
                });
        };

        tokenFactory.GetAll = function(callback) {
            if(!$cookies.get('language')) $cookies.put('language', 'en');

            $http.get('/api/tokens/'+$cookies.get('language'))
                .then(function(response) {
                    $rootScope.languageTokens = response.data.tokens;
                    return callback;
                },
                function(response) {
                    return callback;
                });
        };

        tokenFactory.Get = function(token, callback) {
            if(!$cookies.get('language')) $cookies.put('language', 'en');

            $http.get('/api/tokens/'+$cookies.get('language')+'/'+token)
                .then(function(response) {
                    return callback(response.data.token);
                },
                function(response) {
                    return callback("");
                });
        };

        return tokenFactory;
    });