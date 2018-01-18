/**
 * Created by Hplus on 29/09/2015.
 */

angular.module('trackerApp')
    .factory('Ledger', function($http) {
        var ledgerFactory = {};

        ledgerFactory.GetLedgers = function(which, callback) {
            var query = '/api/l?which=';
            if(which === 'latest') query += which;
            else query += 'all';

            $http.get(query)
                .then(function(response) {
                    return callback(response.data.ledgers);
                },
                function(response) {
                    switch(response.status) {
                        case 400:
                        case 404:
                        case 500:
                            return callback(false);
                            break;
                    }
                });
        };

        ledgerFactory.GetLedger = function(ledger, callback) {
            $http.get('/api/l/'+ledger)
                .then(function(response) {
                    return callback(response.data);
                }, function(response) {
                    return callback(false);
                });
        };

        return ledgerFactory;
    });