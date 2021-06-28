const express = require('express');;


const router = express.Router();
const auth = require('../controllers/auth');
const item_controller = require('../controllers/item');

var multer = require('multer')
var storage = multer.memoryStorage();
var upload = multer({ storage: storage });

router.get('/', auth.CHECK_AUTH, item_controller.GET_ALL_ITEM);
router.get('/pending/', auth.CHECK_AUTH, item_controller.GET_PENDING_ITEM);
router.patch('/:id', auth.CHECK_AUTH, upload.array('image'), item_controller.UPDATE_ITEM);
router.post('/', auth.CHECK_AUTH, upload.array('image'), item_controller.CREATE_ITEM);
router.delete('/:id', auth.CHECK_AUTH, item_controller.DELETE_ITEM);



module.exports = router;
