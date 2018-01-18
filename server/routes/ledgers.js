/**
 * Created by Hplus on 27/09/2015.
 */

var express = require('express');
var router = express.Router();

var accController = require('../controllers/accounts');
var ledController = require('../controllers/ledgers');
var txController = require('../controllers/transactions');


router.route('/l')
    .get(ledController.getLedgers);

router.param('ledger', ledController.validateLedger);
router.route('/l/:ledger')
    .get(ledController.getLedger);
router.route('/l/:ledger/a')
    .get(accController.getLedgerAccounts);
router.route('/l/:ledger/tx')
    .get(txController.getLedgerTransactions, txController.getTransactions);
router.route('/l/:ledger/download')
    .get(ledController.downloadLedger);

exports.router = router;