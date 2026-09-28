const supabase = require('../config/supabase');

const TABLE_NAME = 'screenings';

// جلب كل مواعيد مستخدم معيّن
async function getUserScreenings(userId) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('user_id', userId)
    .order('scheduled_date', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

// إضافة موعد فحص جديد
async function createScreening({ userId, screeningType, scheduledDate, notes }) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([
      {
        user_id: userId,
        screening_type: screeningType,
        scheduled_date: scheduledDate,
        notes: notes || '',
      },
    ])
    .select();

  if (error) throw new Error(error.message);
  return data[0];
}

module.exports = { getUserScreenings, createScreening };
