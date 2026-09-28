const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/events.controller');
const { verifyToken, requireAdmin, optionalAuth } = require('../middleware/auth.middleware');

// القراءة متاحة للجميع (زوار أو مسجّلين)
router.get('/', optionalAuth, eventsController.getEvents);
router.get('/:id', optionalAuth, eventsController.getEvent);

// التسجيل في فعالية يتطلب تسجيل دخول (لكن ليس admin)
router.post('/:id/register', verifyToken, eventsController.register);

// إدارة الفعاليات (إنشاء/تعديل/حذف) - admin فقط
router.post('/', verifyToken, requireAdmin, eventsController.addEvent);
router.put('/:id', verifyToken, requireAdmin, eventsController.editEvent);
router.delete('/:id', verifyToken, requireAdmin, eventsController.removeEvent);

module.exports = router;
