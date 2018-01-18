/**
 * Created by Hplus on 02/10/2015.
 */

angular.module('trackerApp')
    .directive('languageToken', function($rootScope, Token) {
        return {
            scope: true,
            link: function ($scope, $element, $attrs) {
                if(!$rootScope.languageTokens || $rootScope.languageTokens == undefined) Token.Get($attrs.languageToken, function(token) {
                    $scope.languageToken = token;
                });

                else if($rootScope.languageTokens[$attrs.languageToken] != undefined) $scope.languageToken = $rootScope.languageTokens[$attrs.languageToken];
                else $scope.languageToken = "";
            },
            template: '<span>{{languageToken}}</span>'
        }
    });

/*    .directive('languageToken', function(Token) {
        return {
            scope: true,
            link: function (scope, element, attrs) {
                Token.Get(attrs.languageToken, function(token) {
                    scope.languageToken = token;
                });
            },
            template: '<span>{{languageToken}}</span>'
        }
    });
*/