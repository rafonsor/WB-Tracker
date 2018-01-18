/**
 * Created by Hplus on 27/09/2015.
 */

var express = require('express');
var router = express.Router();

var dataController = require('../controllers/data');

router.route('/languages')
    .get(dataController.getLanguages);
router.param('language', dataController.validateLanguage);
router.route('/tokens/:language')
    .get(dataController.getTokens);
router.param('token', dataController.validateToken);
router.route('/tokens/:language/:token')
    .get(dataController.getToken);

router.route('/currencies')
    .get(dataController.getCurrencies);
router.route('/rates')
    .get(dataController.getRates);
router.param('currency', dataController.validateCurrency);
router.route('/rates/:currency')
    .get(dataController.getRate);


exports.router = router;