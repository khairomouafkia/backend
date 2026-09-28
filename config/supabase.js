require('dotenv').config(); // التأكد من تحميل متغيرات البيئة
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase = null;

if (!supabaseUrl || !supabaseKey) {
  console.error('⚠️ خطأ: SUPABASE_URL أو SUPABASE_KEY غير موجودين في ملف .env');
} else {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (error) {
    console.error('⚠️ خطأ أثناء تهيئة Supabase:', error.message);
  }
}

module.exports = supabase;