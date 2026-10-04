const supabase = require('../config/supabase');
const AppError = require('../middleware/AppError');

const TABLE = 'events';
const REGISTRATIONS_TABLE = 'event_registrations';

function mapEvent(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    location: row.location,
    eventDate: row.event_date,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

async function getAllEvents({ limit = 20, offset = 0 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safeOffset = Math.max(Number(offset) || 0, 0);

  const { data, error, count } = await supabase
    .from(TABLE)
    .select('*', { count: 'exact' })
    .order('event_date', { ascending: true })
    .range(safeOffset, safeOffset + safeLimit - 1);

  if (error) throw new AppError(502, 'تعذّر جلب الفعاليات من الخادم');
  return { data: (data || []).map(mapEvent), page: Math.floor(safeOffset / safeLimit) + 1, total: count || (data || []).length };
}

async function getEventById(id) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116' || error.message.includes('No rows')) throw new AppError(404, 'الفعالية غير موجودة');
    throw new AppError(502, 'تعذّر جلب تفاصيل الفعالية');
  }
  return mapEvent(data);
}

async function createEvent({ title, description, location, eventDate, createdBy }) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert([{ title, description, location, event_date: eventDate, created_by: createdBy }])
    .select();

  if (error) throw new AppError(502, 'تعذّر إنشاء الفعالية');
  return mapEvent(data[0]);
}

async function updateEvent(id, updates) {
  const payload = {};
  if (updates.title) payload.title = updates.title;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.location !== undefined) payload.location = updates.location;
  if (updates.eventDate) payload.event_date = updates.eventDate;

  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq('id', id)
    .select();

  if (error) throw new AppError(502, 'تعذّر تحديث الفعالية');
  if (!data || data.length === 0) throw new AppError(404, 'الفعالية غير موجودة');
  return mapEvent(data[0]);
}

async function deleteEvent(id) {
  const { error, data } = await supabase.from(TABLE).delete().eq('id', id).select('id');
  if (error) throw new AppError(502, 'تعذّر حذف الفعالية');
  if (!data || data.length === 0) throw new AppError(404, 'الفعالية غير موجودة');
  return true;
}

async function registerForEvent(eventId, userId) {
  const { data, error } = await supabase
    .from(REGISTRATIONS_TABLE)
    .insert([{ event_id: eventId, user_id: userId }])
    .select();

  if (error) {
    if (error.code === '23505' || error.message.includes('duplicate')) throw new AppError(409, 'أنت مسجّل في هذه الفعالية بالفعل');
    throw new AppError(502, 'تعذّر التسجيل في الفعالية');
  }
  return { id: data[0].id, eventId: data[0].event_id, userId: data[0].user_id };
}

async function getUserRegistrations(userId) {
  const { data, error } = await supabase
    .from(REGISTRATIONS_TABLE)
    .select('event_id')
    .eq('user_id', userId);

  if (error) throw new AppError(502, 'تعذّر جلب تسجيلات الفعاليات');
  return (data || []).map((row) => String(row.event_id));
}

async function cancelRegistration(eventId, userId) {
  const { data, error } = await supabase
    .from(REGISTRATIONS_TABLE)
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle();

  if (error) throw new AppError(502, 'تعذّر إلغاء التسجيل في الفعالية');
  if (!data) throw new AppError(404, 'التسجيل في هذه الفعالية غير موجود');
}

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  getUserRegistrations,
  cancelRegistration,
};
