const supabase = require('../config/supabase');

const TABLE_NAME = 'community_posts';

// جلب كل المنشورات، الأحدث أولاً
async function getAllPosts() {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

// إنشاء منشور جديد
async function createPost({ userId, authorName, isAnonymous, content }) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([
      {
        user_id: userId,
        author_name: isAnonymous ? 'مستخدم مجهول' : authorName,
        is_anonymous: isAnonymous,
        content,
      },
    ])
    .select();

  if (error) throw new Error(error.message);
  return data[0];
}

module.exports = { getAllPosts, createPost };
