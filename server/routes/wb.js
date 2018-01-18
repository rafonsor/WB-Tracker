/**
 * Created by Hplus on 27/09/2015.
 */

var express = require('express');
var router = express.Router();

var accController = require('../controllers/accounts');
var resController = require('../controllers/resources');
var wbController = require('../controllers/wb');

router.use(wbController.isWorldBank);

router.route('/wb/auth')
    .post(wbController.updateAuth);

router.route('/wb/account')
    .post(accController.newAccount);

router.param('node', resController.validateNode);
router.route('/wb/subs/:node')
    .post(wbController.subscribe)
    .put(wbController.updateSubscriptions)
    .delete(wbController.unsubscribe);


exports.router = router;