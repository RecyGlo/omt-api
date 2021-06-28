const express = require('express');;
const router = express.Router();
const auth = require('../controllers/auth');
const contact_controller = require('../controllers/contact');

var multer = require('multer')
var storage = multer.memoryStorage();
var upload = multer({ storage: storage });

router.get('/', auth.CHECK_AUTH, contact_controller.GET_ALL_CONTACT);
router.post('/', auth.CHECK_AUTH, upload.array('image'), contact_controller.CREATE_CONTACT);

module.exports = router;
