const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// استخدام الشات بوت يتطلب تسجيل دخول
router.post('/chat', verifyToken, aiController.chat);

module.exports = router;
