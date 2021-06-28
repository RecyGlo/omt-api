const express = require('express');;

const router = express.Router();
const auth = require('../controllers/auth');
const market_place_controller = require('../controllers/marketPlace');

var multer = require('multer')
var storage = multer.memoryStorage();
var upload = multer({ storage: storage });

router.get('/', auth.CHECK_AUTH, market_place_controller.GET_ALL_MARKET_PLACE);
router.get('/dashboard/', auth.CHECK_AUTH, market_place_controller.GET_DASHBOARD_ALL_MARKET_PLACE);
router.patch('/:id', auth.CHECK_AUTH, upload.array('image'), market_place_controller.UPDATE_MARKET_PLACE);
router.get('/:id', auth.CHECK_AUTH, market_place_controller.GET_MARKET_PLACE_INFO);
router.get('/uploaded_product/:id', auth.CHECK_AUTH, market_place_controller.GET_UPLOADED_MARKET_PRODUCT);
router.get('/notification/:id', auth.CHECK_AUTH, market_place_controller.GET_MARKET_PLACE_NOTIFICATION);
router.get('/saved_product/:id', auth.CHECK_AUTH, market_place_controller.GET_SAVED_MARKET_PRODUCT);
router.get('/ordered_product/:id', auth.CHECK_AUTH, market_place_controller.GET_ORDERED_MARKET_PRODUCT);
router.get('/ordered_product/accepted/:id', auth.CHECK_AUTH, market_place_controller.GET_ORDERED_ACCEPTED_MARKET_PRODUCT);
router.get('/ordered_product/my_product/:id', auth.CHECK_AUTH, upload.array('image'), market_place_controller.GET_MY_MARKET_PRODUCT_ORDERED);
router.get('/ordered_product/my_product/accepted/:id', auth.CHECK_AUTH, upload.array('image'), market_place_controller.GET_MY_MARKET_PRODUCT_ORDERED_ACCEPTED);
router.patch('/saved_product/:id', auth.CHECK_AUTH, upload.array('image'), market_place_controller.SAVE_MARKET_PRODUCT);
router.patch('/ordered_product/:id', auth.CHECK_AUTH, upload.array('image'), market_place_controller.ORDER_MARKET_PRODUCT);
router.patch('/discussed_product/:id', auth.CHECK_AUTH, upload.array('image'), market_place_controller.DISCUSS_MARKET_PRODUCT);
router.patch('/ordered_product/my_product/:id', auth.CHECK_AUTH, upload.array('image'), market_place_controller.ACCEPT_MY_MARKET_PRODUCT_ORDERED);


router.post('/', auth.CHECK_AUTH, upload.array('image'), market_place_controller.CREATE_MARKET_PLACE);


module.exports = router;
