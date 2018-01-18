/**
 * Created by Hplus on 29/09/2015.
 */

angular.module('trackerApp')
    .factory('Entity', function($http) {
        var entityFactory = {};

        entityFactory.GetAll = function(callback) {
            $http.get('/e')
                .then(function(response) {
                    return callback(response.data.entities);
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

        entityFactory.GetSingle = function(entity, callback) {
            $http.get('/e/'+entity)
                .then(function(response) {
                    return callback(response.data.entity);
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

        return entityFactory;

    });