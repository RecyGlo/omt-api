const express = require('express');;
const router = express.Router();
const auth = require('../controllers/auth');
const dashboard_controller = require('../controllers//dashboard');

router.get('/', auth.CHECK_AUTH, dashboard_controller.GET_ALL_COUNT);


module.exports = router;
