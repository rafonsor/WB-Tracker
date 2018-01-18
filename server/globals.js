/**
 * Created by Hplus on 26/09/2015.
 */

exports.ledgerRegex = /^[0-9]{10}$/;
exports.hashRegex = /^[0-9A-Z]{40}$/i;
exports.slotRegex = /^[A-Z]{3}[0-9]$/i;
exports.accountRegex = /^[A-Z]{3}[0-9]{7}$/i;
exports.allAccountsRegex = /[A-Z]{3}[0-9]{7}/g;
exports.passportRegex = /^50[A-Z0-9]{6}$/i;
exports.entityRegex = /^45[A-Z0-9]{6}$/i;
exports.nodeRegex = /^4E[A-Z0-9]{6}$/i;
exports.daoRegex = /^4F[A-Z0-9]{6}$/i;
exports.dasRegex = /^53[A-Z0-9]{6}$/i;
exports.resourceRegex = /^[A-Z0-9]$/i;
exports.keyRegex = /^([0-9A-Z]{128}|[0-9A-Z]{196})$/i;
exports.nameRegex = /^[a-z0-9,&@_-]$/i;
exports.timestampRegex = /^[0-9]{19}$/;
exports.versionRegex = /^(201[5-9]|20[2-9][0-9])((01|03|05|07|08|10|12)([0-2][0-9]|3[0-1])|(04|06|09|11)([0-2][0-9]|30)|02[0-2][0-9])v([1-9][0-9]*)$/;
exports.wbCredentialsRegex = /^WB[a-z0-9+/=]{60}$/;
exports.ipRegex = /^(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])([.](25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])){3}$/;
exports.portRegex = /^(6553[0-5]|655[0-2][0-9]|65[0-4][0-9]{2}|6[0-4][0-9]{3}|[1-5][0-9]{4}|[1-9][0-9]{1,3}|[0-9])$/;
exports.websiteRegex = /^(http(s)?:\/\/)?([a-z0-9-]+\.)?[a-z0-9-]+\.([a-z]{2,3}\.)?[a-z]{2,10}\/?$/i;
exports.tokenRegex = /^[a-z0-9_]+$/i;
exports.currencyRegex = /^[a-z]{3}$/i;


//Publisher Network Codes
exports.NETWORK_PUBLISH_TRANSACTION = 0xB000;
exports.NETWORK_PUBLISH_LEDGER = 0xB001;
exports.NETWORK_PUBLISH_BLOCK = 0xB002;
exports.NETWORK_SUBSCRIBE = 0xB100;
exports.NETWORK_SUBSCRIPTIONS = 0xB101;
exports.NETWORK_UNSUBSCRIBE = 0xB102;

//Tracker Network Codes
exports.NETWORK_TRACKER_LATEST = 0xB200;
exports.NETWORK_TRACKER_GET = 0xB201;
exports.TRACKER_CODE_LENGTH = 4;
exports.TRACKER_CODE_TRANSACTION = 1000;
exports.TRACKER_CODE_LEDGER = 1001;
exports.TRACKER_CODE_NME = 1002;
exports.TRACKER_CODE_NMB = 1003;
exports.TRACKER_GET_BY_HASH = 0x00;
exports.TRACKER_GET_BY_ID = 0x01;

//Transaction types
exports.transactionTypes = ['basic', 'delayed', 'future', 'DAO', 'DAS'];
exports.BASIC_TRANSACTION = '00';
exports.DELAYED_TRANSACTION = '01';
exports.FUTURE_TRANSACTION = '02';
exports.DAO_TRANSACTION = '4F';
exports.DAS_TRANSACTION = '53';

exports.slotFilters = ['official', 'reserved', 'active'];
exports.languages = ['en', 'fr', 'pt', 'es', 'de', 'ru', 'nl', 'it', 'cn', 'jp', 'ko', 'tr', 'pl'];

//exports.ledgersStorage = '/var/local/tracker/ledgers/';
exports.ledgersStorage = 'data/ledgers/';
exports.ledgerExtension = ".ldgr";
exports.ledgerDuration = 3600000; //1 hour in ms
exports.genesisClose = 1451606399999; // 31/12/2015 23:59:59.999ms

exports.blocksStorage = 'data/nmb/';
exports.blockExtension = ".nmb";

exports.nodeSignatureLength = 128;