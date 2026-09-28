const express = require('express');
const router = express.Router();
const screeningsController = require('../controllers/screenings.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.get('/', verifyToken, screeningsController.getScreenings);
router.get('/:userId', verifyToken, screeningsController.getScreenings);
router.post('/', verifyToken, screeningsController.addScreening);

module.exports = router;