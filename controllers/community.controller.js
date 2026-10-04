const { z } = require('zod');
const communityService = require('../services/community.service');
const AppError = require('../middleware/AppError');
const asyncHandler = require('../middleware/asyncHandler');

const getPostsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
}).passthrough();

const postSchema = z.object({
  content: z.string().trim().min(1).max(2000),
  authorName: z.string().trim().max(100).optional(),
  isAnonymous: z.boolean().optional().default(false),
}).strict();

async function getPosts(req, res) {
  const parsed = getPostsSchema.safeParse(req.query || {});
  if (!parsed.success) {
    throw new AppError(400, 'معلمات الاستعلام غير صالحة', parsed.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    })));
  }

  const limit = parsed.data.limit || 20;
  const offset = parsed.data.offset || 0;
  const paginated = await communityService.getAllPosts({ limit, offset });
  res.status(200).json({ success: true, data: paginated.data, page: paginated.page, total: paginated.total });
}

async function addPost(req, res) {
  const parsed = postSchema.safeParse(req.body || {});
  if (!parsed.success) {
    throw new AppError(400, 'بيانات المنشور غير صالحة', parsed.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    })));
  }

  const { authorName, isAnonymous, content } = parsed.data;
  const userId = req.user.uid;

  const newPost = await communityService.createPost({
    userId,
    authorName,
    isAnonymous,
    content,
  });

  res.status(201).json({ success: true, data: newPost });
}

module.exports = { getPosts: asyncHandler(getPosts), addPost: asyncHandler(addPost) };
