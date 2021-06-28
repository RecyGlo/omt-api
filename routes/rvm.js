const express = require('express');

const router = express.Router();
const auth = require('../controllers/auth');
const rvmController = require('../controllers/rvm');

router.get('/', auth.CHECK_APIKEY, rvmController.GET_ALL_RVM);
router.get('/:id', auth.CHECK_APIKEY, rvmController.GET_SPECIFIC_RVM);
router.post('/', auth.CHECK_APIKEY, rvmController.CREATE_RVM);
router.post('/open_door', auth.CHECK_APIKEY, rvmController.OPEN_DOOR);
router.post('/close_door', auth.CHECK_APIKEY, rvmController.CLOSE_DOOR);
router.delete('/:id', auth.CHECK_APIKEY, rvmController.DELETE_RVM);

module.exports = router;
