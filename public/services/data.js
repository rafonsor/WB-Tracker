/**
 * Created by Hplus on 29/09/2015.
 */

angular.module('trackerApp')
    .factory('Data', function($http) {
        var dataFactory = {};

        dataFactory.GetSlot = function(slot, callback) {
            $http.get('/api/s/'+slot)
                .then(function(response) {
                    return callback(response.data.slot);
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

        dataFactory.GetSlots = function(filter, start, callback) {
            var query = '/api/s?filter='+filter;
            if(start) query += '&start='+start;

            $http.get(query)
                .then(function(response) {
                    return callback(response.data.slots);
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

        dataFactory.GetEntitySlots = function(entity, callback) {
            var query = '/api/s';
            if(entity) query += '?entity='+entity;

            $http.get(query)
                .then(function(response) {
                    return callback(response.data);
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

        dataFactory.GetNodes = function(callback) {
            $http.get('/api/n')
                .then(function(response) {
                    return callback(response.data.nodes);
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

        return dataFactory;

    });