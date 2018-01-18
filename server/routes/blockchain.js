/**
 * Created by hplus on 07/08/2016.
 */

var express = require('express');
var router = express.Router();

var nmbController = require('../controllers/blockchain');

router.route('/nmb')
    .get(nmbController.getBlocks);

router.param('block', nmbController.validateBlock);
router.route('/nmb/b/:block')
    .get(nmbController.getBlock);
router.route('/nmb/b/:block/e')
    .get(nmbController.getBlockEntries);
router.route('/nmb/b/:block/download')
    .get(nmbController.downloadBlock);

router.route('/nmb/e/:entry', nmbController.validateEntry)
    .get(nmbController.getEntry);


exports.router = router;