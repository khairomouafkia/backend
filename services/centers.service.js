const supabase = require('../config/supabase');

const TABLE = 'screening_centers';

// جلب كل المراكز (متاح للزوار)
async function getAllCenters() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

async function getCenterById(id) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// إنشاء مركز جديد - admin فقط
async function createCenter({ name, address, phone, city, latitude, longitude, createdBy }) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert([
      {
        name,
        address,
        phone,
        city,
        latitude,
        longitude,
        created_by: createdBy,
      },
    ])
    .select();

  if (error) throw new Error(error.message);
  return data[0];
}

// تعديل مركز - admin فقط
async function updateCenter(id, updates) {
  const { data, error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq('id', id)
    .select();

  if (error) throw new Error(error.message);
  return data[0];
}

// حذف مركز - admin فقط
async function deleteCenter(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw new Error(error.message);
  return true;
}

module.exports = {
  getAllCenters,
  getCenterById,
  createCenter,
  updateCenter,
  deleteCenter,
};
