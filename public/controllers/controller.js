/**
 * Created by Hplus on 28/09/2015.
 */

function TimestampToDate(timestamp) {
    var then = new Date(timestamp/1000000);
    var now = new Date();
    var diff = (now - then)/1000;

    var date = then.toLocaleTimeString()+" (+ ";
    if((diff/3600)>0) date += Math.round(diff/3600)+"h";
    date += Math.round((diff%3600)/60)+"m)";

    return date;
}

function TimestampToDateSimple(timestamp) {
    var then = new Date(timestamp/1000000);
    return then.toLocaleDateString();
}

function TimestampToHowLong(timestamp) {
    var now = new Date();
    var diff = (now - (timestamp/1000000))/1000;

    if(diff < 30) return "< 30s";
    if(diff < 60) return "< 1m";
    else return "> 1m";
}

function SizeIn(size) {
    if(size < 1000) return size+' B';
    if(size < 1000000) return (Math.round(size/1000)/1000)+' kB';
    if(size < 1000000000) return (Math.round(size/1000000)/1000)+' MB';
    else return (Math.round(size/1000000000)/1000)+' GB';
}

function IsOnline(host, index, callback) {
    var img = new Image();

    img.onerror = function () {
        if (!img) return false;
        callback('online', index);
    };

    img.onload = img.onerror;
    img.src = 'http://'+host;

    setTimeout(function () {
        if (!img) return;
        callback('offline', index);
    }, 100);
}

var currencySymbols = {
    EUR: '€',
    USD: '$',
    MXN: '$',
    AUD: '$',
    CAN: '$',
    NZD: '$',
    JPY: '¥',
    GBP: '£'
};

var ledgerRegex = /^[0-9]{10}$/;
var hashRegex = /^[0-9A-Z]{40}$/i;
var slotRegex = /^[A-Z]{3}[0-9]$/i;
var accountRegex = /^[A-Z]{3}[0-9]{7}$/i;
var entityRegex = /^45[a-z0-9]$/i;

angular.module('trackerApp')
    .controller('indexController', ['$scope', '$state', '$cookies', 'Token', 'Rate', function ($scope, $state, $cookies, Token, Rate) {
        $scope.WebsiteName = "Website Name Test";
        $scope.Website = window.location.protocol+'//'+window.location.host;
        $scope.languages;
        $scope.currencies;
        $scope.rate;
        $scope.searchContent;

        if(!$cookies.get('language')) $cookies.put('language', 'en');
        $scope.currentLanguage = !$cookies.get('language');
        Token.GetAll();
        Token.GetLanguages(function(data) {
            $scope.languages = data;
        });

        if(!$cookies.get('currency')) $cookies.put('currency', 'USD');
        $scope.currentCurrency = $cookies.get('currency');
        Rate.GetCurrencies(function(data) {
            $scope.currencies = data;
        });

        Rate.GetRate($scope.currentCurrency, function(rate) {
            if(!rate || rate.length == 0) $scope.currentRate = false;
            else if(currencySymbols[$scope.currentCurrency] != undefined) $scope.currentRate = currencySymbols[$scope.currentCurrency]+rate;
            else $scope.currentRate = rate+' '+$scope.currentCurrency;
        });

        $scope.SetLanguage = function(language) {
            if($scope.languages[language] != undefined) language = 'en';
            $cookies.put('language', language);
            window.location.reload();
        };

        $scope.SetCurrency = function(currency) {
            if($scope.currencies[currency] != undefined) currency = 'EUR';
            $cookies.put('currency', currency);
            window.location.reload();
        };


        $scope.search = function() {
            if($scope.searchContent && $scope.searchContent.length > 0) {
                $scope.searchContent = undefined;
                if(hashRegex.test($scope.searchContent)) $state.go('transaction', {'hash': $scope.searchContent});
                else if(accountRegex.test($scope.searchContent)) $state.go('account', {'account': $scope.searchContent});
                else if(ledgerRegex.test($scope.searchContent)) $state.go('ledger', {'ledger': $scope.searchContent});
                else if(slotRegex.test($scope.searchContent)) $state.go('slot', {'slot': $scope.searchContent});
                else if(entityRegex.test($scope.searchContent)) $state.go('entity', {'entity': $scope.searchContent});
                else $state.go('404');
            }
        };
    }])

    .controller('homeController', ['$rootScope', '$scope', '$state', 'Ledger', function($rootScope, $scope, $state, Ledger) {
        $scope.searchContent;

        Ledger.GetLedgers('latest', function(data) {
            $scope.ledgers = data;
            if(!$scope.ledgers)  $scope.notFound = true;
        });

        $rootScope.SocketIO = io.connect('http://'+window.location.hostname+':'+8100, {'forceNew': true});
        $rootScope.SocketIO.on('latest', function(data) {
            $scope.transactions = data;
        });
        $rootScope.SocketIO.on('transaction', function (data) {
            $scope.transactions.pop();
            $scope.transactions.push(data);
        });

        $scope.TimestampToDate = TimestampToDate;
        $scope.TimestampToHowLong = TimestampToHowLong;
        $scope.SizeIn = SizeIn;

        $scope.search = function() {
            if(hashRegex.test($scope.searchContent)) $state.go('transaction', {'hash': $scope.searchContent});
            else if(accountRegex.test($scope.searchContent)) $state.go('account', {'account': $scope.searchContent});
            else if(ledgerRegex.test($scope.searchContent)) $state.go('ledger', {'ledger': $scope.searchContent});
            else if(slotRegex.test($scope.searchContent)) $state.go('slot', {'slot': $scope.searchContent});
            else if(entityRegex.test($scope.searchContent)) $state.go('entity', {'entity': $scope.searchContent});
            else $state.go('404');
        }

    }])

    .controller('ledgerController', ['$scope', '$stateParams', 'Ledger', function($scope, $stateParams, Ledger) {
        $scope.ledgerId = $stateParams.ledger;

        Ledger.GetLedger($scope.ledgerId, function(data) {
            $scope.ledger = data;
            $scope.ledger.link = window.location.host+'/api/l/'+$scope.ledgerId+'/download';
            if(!$scope.ledger) $scope.NotFoundError = true;
        });

        $scope.TimestampToDateSimple = TimestampToDateSimple;
        $scope.SizeIn = SizeIn;
    }])

    .controller('ledgersController', ['$scope', 'Ledger', function($scope, Ledger) {
        Ledger.GetLedgers('all', function (data) {
            $scope.ledgers = data;
            if(!$scope.ledgers) $scope.error = true;
        });

        $scope.TimestampToDate = TimestampToDate;
    }])

    .controller('ledgerAccountsController', ['$scope', '$state', '$stateParams', 'Account', function($scope, $state, $stateParams, Account) {
        $scope.ledgerId = $stateParams.ledger_a;

        Account.GetLedgerAccounts($scope.ledgerId, false, function (data) {
            $scope.accounts = data;
            if(!$scope.accounts) $state.go('404');
            else if(Object.keys($scope.accounts).length < 100) $scope.reachedEnd = true;
        });

        $scope.ViewMore = function() {
            var keys = Object.keys($scope.accounts);
            var last = keys[keys.length-1];

            Account.GetLedgerAccounts($scope.ledgerId, last, function(data) {
                if (!data || Object.keys(data).length < 100) $scope.reachedEnd = true;
                for (var acc in data) $scope.accounts[acc] = data[acc];
            });
        };

    }])

    .controller('ledgerTransactionsController', ['$scope', '$state', '$stateParams', 'Transaction', function($scope, $state, $stateParams, Transaction) {
        $scope.ledgerId = $stateParams.ledger_t;

        Transaction.GetLedgerTransactions($scope.ledgerId, false, function(data) {
            $scope.transactions = data;
            if (!$scope.transactions) $state.go('404');
            else if (Object.keys($scope.transactions).length < 100) $scope.reachedEnd = true;
        });

        $scope.ViewMore = function() {
            var last = $scope.transactions[$scope.transactions.length-1].timestamp;

            Transaction.GetLedgerTransactions($scope.ledgerId, last, function(data) {
                if (!data) $scope.reachedEnd = true;
                else {
                    if (data.length < 100) $scope.reachedEnd = true;
                    $scope.transactions = $scope.transactions.concat(data);
                }
            });
        };

        $scope.TimestampToDateSimple = TimestampToDateSimple;

    }])

    .controller('accountController', ['$scope', '$state', '$stateParams', 'Account', 'Transaction', function($scope, $state, $stateParams, Account, Transaction) {
        $scope.account = $stateParams.account;
        $scope.transactions = [];

        Account.GetAccount($scope.account, function(data) {
            $scope.info = data;
            if (!$scope.info) $state.go('404');
        });

        Transaction.GetAccountTransactions($scope.account, false, function(data) {
            ProcessData(data);
        });

        $scope.ViewMore = function() {
            var last = $scope.transactions[$scope.transactions.length-1].timestamp;

            Transaction.GetAccountTransactions($scope.account, last, function(data) {
                ProcessData(data);
            });
        };

        function ProcessData(data) {
            if(!data) $scope.reachedEnd = true;
            else {
                if(data.length < 100) $scope.reachedEnd = true;
                for(var tx in data) {
                    var temp = {hash: data[tx].hash};
                    if(data[tx].sender === $scope.account) {
                        temp.who = data[tx].receiver;
                        temp.amount = (-1*data[tx].amount);
                    }
                    else {
                        temp.who = data[tx].sender;
                        temp.amount = data[tx].inbound.remain;
                    }

                    var now = new Date();
                    var then = new Date(data[tx].timestamp/1000000);
                    var diff = (now-then)/1000;

                    if(diff < 86400) {
                        temp.when = "+";
                        if((diff/3600)>0) temp.when += Math.round(diff/3600)+"h";
                        temp.when += Math.round((diff%3600)/60)+"m";
                    }
                    else temp.when = then.toLocaleDateString();

                    $scope.transactions.push(temp);
                }
            }
        }

    }])

    .controller('transactionsController', ['$scope', 'Transaction', function($scope, Transaction) {
        Transaction.GetLatest(false, function(data) {
            $scope.transactions = data;

            if(!$scope.transactions) $scope.error = true;
            else if($scope.transactions.length < 100) $scope.reachedEnd = true;
        });


        $scope.ViewMore = function() {
            var last = $scope.transactions[$scope.transactions.length-1];

            Transaction.GetLatest(last, function(data) {
                if(!data) $scope.error = true;
                else {
                    if(data.length < 100) $scope.reachedEnd = true;
                    $scope.transactions = $scope.transactions.concat(data);
                }
            });
        };
    }])

    .controller('transactionController', ['$scope', '$state', '$stateParams', 'Transaction', 'Data', function($scope, $state, $stateParams, Transaction, Data) {
        $scope.hash = $stateParams.hash;

        Transaction.GetSingle($scope.hash, function(data) {
            $scope.transaction = data;
            if (!$scope.transaction) $state.go('404');

            Data.GetSlot($scope.transaction.sender.substr(0,4), function(data) {
                $scope.transaction.outbound.entity = data.entity;
            });
            Data.GetSlot($scope.transaction.receiver.substr(0,4), function(data) {
                $scope.transaction.inbound.entity = data.entity;
            });
        });
    }])

    .controller('entitiesController', ['$scope', '$state', 'Entity', function($scope, $state, Entity) {
        Entity.GetAll(function(data) {
            if(data) $scope.entities = data;
            else $state.go('500');
        });
    }])

    .controller('entityController', ['$scope', '$state', '$stateParams', 'Entity', 'Data', function($scope, $state, $stateParams, Entity, Data) {
        $scope.entityId = $stateParams.entity;
        Entity.GetSingle($scope.entityId, function(data) {
            if(data) $scope.entity = data;
            else  $state.go('404');
        });

        Data.GetEntitySlots($scope.entityId, function(data) {
            $scope.slots = data.slots;
            if(!$scope.slots) $scope.noSlots = true;
        });
    }])

    .controller('nodesController', ['$scope', 'Data', function($scope, Data) {
        Data.GetNodes(function(data) {
            if(!data) $scope.notFound = true;
            else {
                $scope.nodes = data;
                console.log($scope.nodes);

                for (var i = 0; i < $scope.nodes.length; i++) {
                    $scope.nodes[i].status = "offline";

                    IsOnline($scope.nodes[i].host, i, function (status, index) {
                        console.log('status = '+status);
                        $scope.$apply = function() {
                            $scope.nodes[index].status = status;
                            console.log($scope.nodes[index].status);
                        };
                    });
                }
            }
        });
    }])

    .controller('slotsController', ['$scope', 'Data', function($scope, Data) {
        var last = false;
        Data.GetSlots('active', last, function(data) {
            $scope.slots = data;
            if (!$scope.slots) $scope.notFound = true;
            else if ($scope.slots.length < 500) $scope.reachedEnd = true;
        });

        $scope.filter = 'active';
        $scope.GetSlots = function(filter) {
            if($scope.filter !== filter) {
                switch (filter) {
                    case 'official':
                        $scope.filter = 'official';
                        $scope.order = false;
                        break;
                    case 'reserved':
                        $scope.filter = 'reserved';
                        $scope.order = false;
                        break;
                    default:
                        $scope.filter = 'active';
                        $scope.order = true;
                        break;
                }
                $scope.slots = [];
                $scope.ViewMore();
            }
        };

        $scope.ViewMore = function() {
            if($scope.slots.length == 0) last = false;
            else last = $scope.accounts[$scope.accounts.length-1];

            Data.GetSlots($scope.filter, last, function(data) {
                if (!data) $scope.reachedEnd = true;
                else {
                    if (data.length < 500) $scope.reachedEnd = true;
                    $scope.slots = $scope.slots.concat(data);
                }
            });
        };
    }])

    .controller('slotController', ['$scope', '$state', '$stateParams', 'Data', 'Account', function($scope, $state, $stateParams, Data, Account) {
        $scope.slotId = $stateParams.slot;

        Data.GetSlot($scope.slotId, function(data) {
            $scope.slot = data;
            if (!$scope.slot) $state.go('404');
        });

        Account.GetSlotAccounts($scope.slotId, false, function(data) {
            $scope.accounts = data;
            if(!$scope.accounts || $scope.accounts.length < 500) $scope.reachedEnd = true;
        });

        $scope.ViewMore = function() {
            var last = $scope.accounts[$scope.accounts.length-1];

            Account.GetSlotAccounts($scope.slotId, last, function(data) {
                if (!data) $scope.reachedEnd = true;
                else {
                    if (data.length < 500) $scope.reachedEnd = true;
                    $scope.accounts = $scope.accounts.concat(data);
                }
            });
        };
    }])

    .controller('ratesController', ['$cookies', '$scope', 'Rate', function($cookies, $scope, Rate) {
        $scope.Math = window.Math;
        $scope.currencySelected = $scope.currentCurrency = $cookies.get('currency');
        $scope.amountSelected = 1;
        Rate.GetRates(function(data) {
            $scope.rates = {};
            for(row in data) $scope.rates[data[row].currency] = data[row].rate;
            if (!$scope.rates) $scope.noRatesError = true;
        });

        $scope.ToText = function(currency) {
            if(currencySymbols[currency] !== undefined) return currency+" ("+currencySymbols[currency]+")";
            else return currency;
        };

        $scope.InUdc = function(amountSelected, currencySelected) {
            return window.Math.round((amountSelected / $scope.rates[currencySelected])*10000)/10000;
        };
        $scope.InCurrency = function(amountSelected, currencySelected) {
            return window.Math.round((amountSelected * $scope.rates[currencySelected])*10000)/10000;
        };
    }]);