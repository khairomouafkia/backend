const communityService = require('../services/community.service');

// GET /api/community/posts
async function getPosts(req, res, next) {
  try {
    const posts = await communityService.getAllPosts();
    res.status(200).json({ success: true, data: posts });
  } catch (error) {
    next(error);
  }
}

// POST /api/community/posts
async function addPost(req, res, next) {
  try {
    const { authorName, isAnonymous, content } = req.body;
    const userId = req.user.uid; // من التوكن الموثّق، وليس من العميل

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'content مطلوب',
      });
    }

    const newPost = await communityService.createPost({
      userId,
      authorName,
      isAnonymous,
      content,
    });

    res.status(201).json({ success: true, data: newPost });
  } catch (error) {
    next(error);
  }
}

module.exports = { getPosts, addPost };
