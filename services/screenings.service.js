const supabase = require('../config/supabase');
const AppError = require('../middleware/AppError');

const TABLE_NAME = 'screenings';

function mapScreening(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    screeningType: row.screening_type,
    scheduledDate: row.scheduled_date,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

async function getUserScreenings(userId, { limit = 20, offset = 0 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safeOffset = Math.max(Number(offset) || 0, 0);

  const { data, error, count } = await supabase
    .from(TABLE_NAME)
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('scheduled_date', { ascending: true })
    .range(safeOffset, safeOffset + safeLimit - 1);

  if (error) throw new AppError(502, 'تعذّر جلب مواعيد الفحص');
  return { data: (data || []).map(mapScreening), page: Math.floor(safeOffset / safeLimit) + 1, total: count || (data || []).length };
}

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

  if (error) {
    if (error.code === '23505' || error.message.includes('duplicate')) throw new AppError(409, 'يوجد موعد فحص مطابق لنفس اليوم لهذا المستخدم');
    throw new AppError(502, 'تعذّر إنشاء موعد الفحص');
  }
  return mapScreening(data[0]);
}

async function updateScreening(userId, id, updates) {
  const payload = {};
  if (updates.screeningType !== undefined) payload.screening_type = updates.screeningType;
  if (updates.scheduledDate !== undefined) payload.scheduled_date = updates.scheduledDate;
  if (updates.notes !== undefined) payload.notes = updates.notes;

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(payload)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .maybeSingle();

  if (error) {
    if (error.code === '23505' || error.message.includes('duplicate')) throw new AppError(409, 'يوجد موعد فحص مطابق لنفس اليوم لهذا المستخدم');
    throw new AppError(502, 'تعذّر تحديث موعد الفحص');
  }
  if (!data) throw new AppError(404, 'الموعد غير موجود');
  return mapScreening(data);
}

async function deleteScreening(userId, id) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle();

  if (error) throw new AppError(502, 'تعذّر حذف موعد الفحص');
  if (!data) throw new AppError(404, 'الموعد غير موجود');
}

module.exports = { getUserScreenings, createScreening, updateScreening, deleteScreening };
