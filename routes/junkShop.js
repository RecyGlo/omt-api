const express = require('express');

const router = express.Router();
const auth = require('../controllers/auth');
const junkShopController = require('../controllers/junkShop');

var multer = require('multer')
var storage = multer.memoryStorage();
var upload = multer({ storage: storage });

router.get('/', auth.CHECK_AUTH, junkShopController.GET_ALL_JUNKSHOP);
router.get('/notification/', auth.CHECK_AUTH, junkShopController.GET_NOTIFICATION);
router.get('/pending/', auth.CHECK_AUTH, junkShopController.GET_PENDING_JUNK_SHOP);
router.get('/approved/', auth.CHECK_AUTH, junkShopController.GET_APPROVED_JUNK_SHOP);
router.get('/rejected/', auth.CHECK_AUTH, junkShopController.GET_REJECTED_JUNK_SHOP);
router.get('/added/:id', auth.CHECK_AUTH, junkShopController.GET_ADDED_JUNK_SHOP);
router.get('/:id', auth.CHECK_AUTH, junkShopController.GET_SPECIFIC_JUNKSHOP);
router.post('/', auth.CHECK_AUTH, upload.single('image'), junkShopController.CREATE_JUNKSHOP);
router.patch('/:id', auth.CHECK_AUTH, upload.single('image'), junkShopController.UPDATE_JUNK_SHOP);
router.delete('/:id', auth.CHECK_AUTH, junkShopController.DELETE_JUNKSHOP);


module.exports = router;
