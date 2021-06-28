const express = require('express');

const router = express.Router();
const auth = require('../controllers/auth');
const walletController = require('../controllers/wallet');

router.get('/', auth.CHECK_APIKEY, walletController.GET_ALL_WALLETS);
router.get('/:id', auth.CHECK_APIKEY, walletController.GET_SPECIFIC_WALLET);
router.get('/user/:id', auth.CHECK_APIKEY, walletController.GET_WALLET_BY_USERID);
router.post('/', auth.CHECK_APIKEY, walletController.CREATE_WALLET);
router.delete('/:id', auth.CHECK_APIKEY, walletController.DELETE_WALLET);

module.exports = router;
