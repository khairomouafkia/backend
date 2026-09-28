const supabase = require('../config/supabase');

const TABLE = 'events';
const REGISTRATIONS_TABLE = 'event_registrations';

// جلب كل الفعاليات (متاح للزوار أيضًا)
async function getAllEvents() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('event_date', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

async function getEventById(id) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// إنشاء فعالية جديدة - admin فقط
async function createEvent({ title, description, location, eventDate, createdBy }) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert([
      {
        title,
        description,
        location,
        event_date: eventDate,
        created_by: createdBy,
      },
    ])
    .select();

  if (error) throw new Error(error.message);
  return data[0];
}

// تعديل فعالية - admin فقط
async function updateEvent(id, updates) {
  const { data, error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq('id', id)
    .select();

  if (error) throw new Error(error.message);
  return data[0];
}

// حذف فعالية - admin فقط
async function deleteEvent(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw new Error(error.message);
  return true;
}

// تسجيل مستخدم في فعالية - يتطلب تسجيل دخول
async function registerForEvent(eventId, userId) {
  const { data, error } = await supabase
    .from(REGISTRATIONS_TABLE)
    .insert([{ event_id: eventId, user_id: userId }])
    .select();

  if (error) throw new Error(error.message);
  return data[0];
}

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
};
