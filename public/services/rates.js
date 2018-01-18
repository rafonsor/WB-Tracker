/**
 * Created by Hplus on 02/10/2015.
 */

angular.module('trackerApp')
    .factory('Rate', function($http) {
        var rateFactory = {};

        rateFactory.GetCurrencies = function(callback) {
            $http.get('/api/currencies')
                .then(function(response) {
                    return callback(response.data.currencies);
                },
                function(response) {
                    switch(response.status) {
                        case 400:
                        case 404:
                        case 500:
                            return callback(['EUR', 'USD', 'JPY', 'GBP', 'AUD', 'CHF', 'CAD', 'MXN', 'CNY', 'NZD']);
                            break;
                    }
                });
        };

        rateFactory.GetRate = function(currency, callback) {
            $http.get('/api/rates/'+currency)
                .then(function(response) {
                    return callback(response.data.rates.rate);
                },
                function(response) {
                    return callback(false);
                });
        };

        rateFactory.GetRates = function(callback) {
            $http.get('/api/rates')
                .then(function(response) {
                    return callback(response.data.rates);
                },
                function(response) {
                    return callback(false);
                });
        };

        return rateFactory;
    });