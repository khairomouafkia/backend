const supabase = require('../config/supabase');
const AppError = require('../middleware/AppError');

const TABLE_NAME = 'community_posts';

function mapPost(post) {
  if (!post) return null;
  return {
    id: post.id,
    userId: post.is_anonymous ? null : post.user_id,
    authorName: post.is_anonymous ? 'مستخدم مجهول' : post.author_name,
    isAnonymous: Boolean(post.is_anonymous),
    content: post.content,
    createdAt: post.created_at,
  };
}

async function getAllPosts({ limit = 20, offset = 0 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safeOffset = Math.max(Number(offset) || 0, 0);

  const { data, error, count } = await supabase
    .from(TABLE_NAME)
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(safeOffset, safeOffset + safeLimit - 1);

  if (error) throw new AppError(502, 'تعذّر جلب المنشورات من الخادم');
  return {
    data: (data || []).map(mapPost),
    page: Math.floor(safeOffset / safeLimit) + 1,
    total: count || (data || []).length,
  };
}

async function createPost({ userId, authorName, isAnonymous, content }) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([
      {
        user_id: userId,
        author_name: isAnonymous ? 'مستخدم مجهول' : (authorName || 'مستخدم'),
        is_anonymous: Boolean(isAnonymous),
        content,
      },
    ])
    .select();

  if (error) throw new AppError(502, 'تعذّر إنشاء المنشور');
  return mapPost(data[0]);
}

module.exports = { getAllPosts, createPost };
