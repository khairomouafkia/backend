const supabase = require('../config/supabase');
const AppError = require('../middleware/AppError');

const TABLE = 'screening_centers';

async function ensureCenterIsUnique(name, address, excludeId) {
  const escapeLike = (value) => value.replace(/[\\%_]/g, '\\$&');
  let query = supabase
    .from(TABLE)
    .select('id')
    .ilike('name', escapeLike(name.trim()))
    .ilike('address', escapeLike(address.trim()))
    .limit(1);

  if (excludeId) query = query.neq('id', excludeId);

  const { data, error } = await query;
  if (error) throw new AppError(502, 'تعذّر التحقق من بيانات المركز');
  if (data && data.length > 0) {
    throw new AppError(409, 'يوجد مركز مسجل بالاسم والعنوان نفسيهما');
  }
}

function mapCenter(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    phone: row.phone,
    city: row.city,
    latitude: row.latitude,
    longitude: row.longitude,
    locationUrl: row.location_url,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

async function getAllCenters({ limit = 20, offset = 0 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safeOffset = Math.max(Number(offset) || 0, 0);

  const { data, error, count } = await supabase
    .from(TABLE)
    .select('*', { count: 'exact' })
    .order('name', { ascending: true })
    .range(safeOffset, safeOffset + safeLimit - 1);

  if (error) throw new AppError(502, 'تعذّر جلب المراكز من الخادم');
  return { data: (data || []).map(mapCenter), page: Math.floor(safeOffset / safeLimit) + 1, total: count || (data || []).length };
}

async function getCenterById(id) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116' || error.message.includes('No rows')) throw new AppError(404, 'المركز غير موجود');
    throw new AppError(502, 'تعذّر جلب تفاصيل المركز');
  }
  return mapCenter(data);
}

async function createCenter({ name, address, phone, city, latitude, longitude, locationUrl, createdBy }) {
  await ensureCenterIsUnique(name, address);

  const { data, error } = await supabase
    .from(TABLE)
    .insert([{ name, address, phone, city, latitude, longitude, location_url: locationUrl, created_by: createdBy }])
    .select();

  if (error) throw new AppError(502, 'تعذّر إنشاء المركز');
  return mapCenter(data[0]);
}

async function updateCenter(id, updates) {
  if (updates.name !== undefined || updates.address !== undefined) {
    const { data: current, error: currentError } = await supabase
      .from(TABLE)
      .select('name,address')
      .eq('id', id)
      .single();

    if (currentError) {
      if (currentError.code === 'PGRST116' || currentError.message.includes('No rows')) {
        throw new AppError(404, 'المركز غير موجود');
      }
      throw new AppError(502, 'تعذّر جلب بيانات المركز');
    }

    await ensureCenterIsUnique(
      updates.name ?? current.name,
      updates.address ?? current.address,
      id,
    );
  }

  const payload = {};
  if (updates.name) payload.name = updates.name;
  if (updates.address) payload.address = updates.address;
  if (updates.phone !== undefined) payload.phone = updates.phone;
  if (updates.city !== undefined) payload.city = updates.city;
  if (updates.latitude !== undefined) payload.latitude = updates.latitude;
  if (updates.longitude !== undefined) payload.longitude = updates.longitude;
  if (updates.locationUrl !== undefined) payload.location_url = updates.locationUrl;

  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq('id', id)
    .select();

  if (error) throw new AppError(502, 'تعذّر تحديث المركز');
  if (!data || data.length === 0) throw new AppError(404, 'المركز غير موجود');
  return mapCenter(data[0]);
}

async function deleteCenter(id) {
  const { error, data } = await supabase.from(TABLE).delete().eq('id', id).select('id');
  if (error) throw new AppError(502, 'تعذّر حذف المركز');
  if (!data || data.length === 0) throw new AppError(404, 'المركز غير موجود');
  return true;
}

module.exports = {
  getAllCenters,
  getCenterById,
  createCenter,
  updateCenter,
  deleteCenter,
};
