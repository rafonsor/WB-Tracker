/**
 * Created by Hplus on 26/09/2015.
 */

var express = require('express');
var router = express.Router();

var txController = require('../controllers/transactions');

router.route('/tx')
    .get(txController.getLatestTransactions, txController.getTransactions);
router.param('hash', txController.validateHash);
router.route('/tx/:hash')
    .get(txController.getTransaction);


exports.router = router;