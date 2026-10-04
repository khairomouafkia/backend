const express = require('express');
const router = express.Router();
const screeningsController = require('../controllers/screenings.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// GET /api/screenings keeps the user scoped to the authenticated token user only.
// GET /api/screenings/:userId is intentionally kept for the same user and returns 403 for mismatches.
router.get('/', verifyToken, screeningsController.getScreenings);
router.get('/:userId', verifyToken, screeningsController.getScreenings);
router.post('/', verifyToken, screeningsController.addScreening);
router.put('/:id', verifyToken, screeningsController.editScreening);
router.delete('/:id', verifyToken, screeningsController.removeScreening);

module.exports = router;