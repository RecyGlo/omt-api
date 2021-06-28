const express = require('express');

const router = express.Router();
const auth = require('../controllers/auth');
const user_controller = require('../controllers/user');

var multer = require('multer')
var storage = multer.memoryStorage();
var upload = multer({ storage: storage });

router.post('/refresh_token', auth.REFRESH_TOKEN);
router.post('/log_in', user_controller.LOG_IN);
router.post('/log_in_by_social', user_controller.LOG_IN_BY_SOCIAL);
router.post('/log_in_by_phone_verification', user_controller.LOG_IN_BY_PHONE_VERIFICATION);
router.get('/', auth.CHECK_AUTH, user_controller.GET_ALL_USERS);
router.get('/:id', auth.CHECK_AUTH, user_controller.GET_SPECIFIC_USER);
router.post('/', upload.single('profileImage'), user_controller.CREATE_USER);
router.patch('/:id', auth.CHECK_AUTH, upload.single('profileImage'), user_controller.UPDATE_USER);
// router.patch('/:id', upload.single('profileImage'), user_controller.UPDATE_USER);
router.delete('/:id', auth.CHECK_AUTH, user_controller.DELETE_USER);
router.post('/push_notification', auth.CHECK_AUTH, user_controller.PUSH_NOTIFICATION);
router.get('/notification/', auth.CHECK_AUTH, user_controller.GET_NOTIFICATION);


module.exports = router;
