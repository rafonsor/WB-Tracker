/**
 * Created by Hplus on 28/09/2015.
 */

angular.module('trackerApp')
    .config(['$stateProvider', '$locationProvider', '$urlRouterProvider', function($stateProvider, $locationProvider, $urlRouterProvider) {

        'use strict';

        $urlRouterProvider.otherwise('/');

        $stateProvider
            .state('home', {
                url: '/',
                templateUrl: '/views/home.html'
            })

            .state('ledgers', {
                url: '/l',
                templateUrl: '/views/ledgers.html'
            })

            .state('ledger', {
                url: '/l/{ledger:[0-9]{10}}',
                templateUrl: '/views/ledger.html'
            })

            .state('ledger.accounts', {
                url: '/l/{ledger_a:[0-9]{10}}/a',
                templateUrl: '/views/ledger_accs.html'
            })

            .state('ledger.transactions', {
                url: '/l/{ledger_t:[0-9]{10}}/tx',
                templateUrl: 'views/ledger_txs.html'
            })

            .state('account', {
                url: '/a/{account:[a-zA-Z]{3}[0-9]{7}}',
                templateUrl: 'views/account.html'
            })

            .state('transactions', {
                url: '/tx',
                templateUrl: 'views/transactions.html'
            })

            .state('transaction', {
                url: '/tx/{hash:[a-zA-Z0-9]{40}}',
                templateUrl: 'views/transaction.html'
            })

            .state('entities', {
                url: '/e',
                templateUrl: 'views/entities.html'
            })

            .state('entity', {
                url: '/e/{entity:45[a-zA-Z0-9]{6}}',
                templateUrl: 'views/entity.html'
            })

            .state('nodes', {
                url: '/n',
                templateUrl: 'views/nodes.html'
            })

            .state('slots', {
                url: '/s',
                templateUrl: '/views/slots.html'
            })

            .state('slot', {
                url: '/s/{slot:[a-zA-Z]{3}[0-9]}',
                templateUrl: 'views/slot.html'
            })

            .state('rates', {
                url: '/r',
                templateUrl: 'views/rates.html'
            })

            .state('404', {
                url: '/404',
                templateUrl: 'views/404.html'
            })

            .state('500', {
                url: '/500',
                templateUrl: 'views/500.html'
            });

    }]);