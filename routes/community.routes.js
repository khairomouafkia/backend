const express = require('express');
const router = express.Router();
const communityController = require('../controllers/community.controller');
const { verifyToken, optionalAuth } = require('../middleware/auth.middleware');

router.get('/posts', optionalAuth, communityController.getPosts);
// نشر منشور يتطلب تسجيل دخول
router.post('/posts', verifyToken, communityController.addPost);

module.exports = router;
