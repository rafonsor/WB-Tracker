/**
 * Created by hplus on 07/08/2016.
 */

var express = require('express');
var router = express.Router();

var accController = require('../controllers/accounts');
var nmbController = require('../controllers/blockchain');
var resController = require('../controllers/resources');
var txController = require('../controllers/transactions');


router.route('/s')
    .get(resController.getSlots);
router.param('slot', resController.validateSlot);
router.route('/s/:slot')
    .get(resController.getSlot);
router.route('/s/:slot/a')
    .get(accController.getSlotAccounts);

router.route('/p')
    .get(resController.getPassports);
router.param('passport', resController.validatePassport);
router.route('/p/:passport')
    .get(resController.getPassport);
router.route('/p/:passport/rel')
    .get(resController.getPassportRelations);
router.route('/p/:passport/e')
    .get(nmbController.getPassportEntries);

router.route('/n')
    .get(resController.getNodes);

router.route('/e')
    .get(resController.getEntities);
router.param('entity', resController.validateEntity);
router.route('/e/:entity')
    .get(resController.getEntity);
router.route('/e/:entity/s')
    .get(resController.getEntitySlots);
router.route('/e/:entity/nmb')
    .get(nmbController.getEntityEntries);

router.route('/dao')
    .get(resController.getDAOs);
router.param('dao', resController.validateDAO);
router.route('/dao/:dao')
    .get(resController.getDAO);
router.route('/dao/:dao/tx')
    .get(txController.getDAOTransactions);

router.route('/das')
    .get(resController.getDASs);
router.param('das', resController.validateDAS);
router.route('/das/:das')
    .get(resController.getDAS);
router.route('/das/:das/tx')
    .get(txController.getDASTransactions);

router.route('/res')
    .get(resController.getResources);
router.param('resource', resController.validateResource);
router.route('/res/:resource')
    .get(resController.getResource);
router.route('/res/:resource/nmb')
    .get(nmbController.getResourceEntries);


exports.router = router;