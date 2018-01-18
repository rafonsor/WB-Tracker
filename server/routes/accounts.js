/**
 * Created by Hplus on 27/09/2015.
 */

var express = require('express');
var router = express.Router();

var accController = require('../controllers/accounts');
var txController = require('../controllers/transactions');


router.param('account', accController.validateAccount);
router.route('/a/:account')
    .get(accController.getAccount);
router.route('/a/:account/tx')
    .get(txController.getAccountTransactions, txController.getTransactions);


exports.router = router;