const express = require('express');

const router = express.Router();
const miscController = require('../controllers/misc');

router.get('/', miscController.GREET);

module.exports = router;
