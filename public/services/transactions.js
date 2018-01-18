/**
 * Created by Hplus on 29/09/2015.
 */

angular.module('trackerApp')
    .factory('Transaction', function($http) {
        var transactionFactory = {};

        transactionFactory.GetSingle = function(hash, callback) {
            return $http.get('/api/tx/'+hash)
                .then(function(response) {
                    console.log(response);
                    console.log(response.data);
                    console.log(response.data.transaction);
                    return callback(response.data.transaction);
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

        transactionFactory.GetLatest = function(start, callback) {
            var query = '/api/tx';
            if(start) query += '?start='+start;

            $http.get(query)
                .then(function(response) {
                    return callback(response.data.transactions);
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

        transactionFactory.GetLedgerTransactions = function(ledger, start, callback) {
            var query = '/api/l/'+ledger+'/tx';
            if(start) query += '?start='+start;

            $http.get(query)
                .then(function(response) {
                    return callback(response.data.transactions);
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

        transactionFactory.GetAccountTransactions = function(account, start, callback) {
            var query = '/api/a/'+account+'/tx';
            if(start) query += '?start='+start;

            $http.get(query)
                .then(function(response) {
                    return callback(response.data.transactions);
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

        return transactionFactory;
    });