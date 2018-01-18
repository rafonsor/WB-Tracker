/**
 * Created by Hplus on 28/09/2015.
 */

var trackerApp = angular.module('trackerApp', ['ui.router', 'ngCookies']);

/*trackerApp.run(['$rootScope', function ($rootScope) {
    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){
        if($rootScope.SocketIO !== undefined) $rootScope.SocketIO.disconnect();
     });
}]);
*/
