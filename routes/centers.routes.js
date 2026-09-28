const express = require('express');
const router = express.Router();
const centersController = require('../controllers/centers.controller');
const { verifyToken, requireAdmin, optionalAuth } = require('../middleware/auth.middleware');

// القراءة متاحة للجميع
router.get('/', optionalAuth, centersController.getCenters);
router.get('/:id', optionalAuth, centersController.getCenter);

// الإدارة - admin فقط
router.post('/', verifyToken, requireAdmin, centersController.addCenter);
router.put('/:id', verifyToken, requireAdmin, centersController.editCenter);
router.delete('/:id', verifyToken, requireAdmin, centersController.removeCenter);

module.exports = router;
