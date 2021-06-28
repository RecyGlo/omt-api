const express = require('express');

const router = express.Router();
const auth = require('../controllers/auth');
const newsController = require('../controllers/news');

var multer = require('multer')
var storage = multer.memoryStorage();
var upload = multer({ storage: storage });

router.get('/', auth.CHECK_AUTH, newsController.GET_ALL_NEWS);
router.get('/pending/', auth.CHECK_AUTH, newsController.GET_PENDING_NEWS);
router.get('/:id', auth.CHECK_AUTH, newsController.GET_SPECIFIC_NEWS);
router.post('/', auth.CHECK_AUTH, upload.array('image'), newsController.CREATE_NEWS);
router.patch('/:id', auth.CHECK_AUTH, upload.array('image'), newsController.UPDATE_NEWS);
router.delete('/:id', auth.CHECK_AUTH, newsController.DELETE_NEWS);

module.exports = router;
