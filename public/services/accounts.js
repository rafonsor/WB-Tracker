/**
 * Created by Hplus on 29/09/2015.
 */

angular.module('trackerApp')
    .factory('Account', function($http) {
        var accountFactory = {};

        accountFactory.GetAccount = function(account, callback) {
            $http.get('/api/a/'+account)
                .then(function(response) {
                    return callback(response.data);
                },
                function(response) {
                    return callback(false);
                });
        };

        accountFactory.GetLedgerAccounts = function(ledger, start, callback) {
            var query = '/api/l/'+ledger+'/a';
            if(start) query += '?start='+start;

            $http.get(query)
                .then(function(response) {
                    return callback(response.data.accounts);
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

        accountFactory.GetSlotAccounts = function(slot, start, callback) {
            var query = '/api/l/'+slot+'/a';
            if(start) query += '?start='+start;

            $http.get(query)
                .then(function(response) {
                    return callback(response.data.accounts);
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


        return accountFactory;
    });