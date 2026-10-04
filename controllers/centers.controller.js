const { z } = require('zod');
const centersService = require('../services/centers.service');
const AppError = require('../middleware/AppError');
const asyncHandler = require('../middleware/asyncHandler');

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
}).passthrough();

const centerIdSchema = z.object({ id: z.string().trim().min(1) });
const locationUrlSchema = z.string().trim().max(2048).url().refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === 'https:' || protocol === 'http:';
}, 'يجب أن يبدأ رابط الموقع بـ http أو https');

const createCenterSchema = z.object({
  name: z.string().trim().min(1).max(200),
  address: z.string().trim().min(1).max(500),
  phone: z.string().trim().max(50).optional(),
  city: z.string().trim().max(100).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  locationUrl: locationUrlSchema.optional(),
}).strict();

const updateCenterSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  address: z.string().trim().min(1).max(500).optional(),
  phone: z.string().trim().max(50).optional(),
  city: z.string().trim().max(100).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  locationUrl: locationUrlSchema.optional(),
}).strict();

async function getCenters(req, res) {
  const parsed = listQuerySchema.safeParse(req.query || {});
  if (!parsed.success) {
    throw new AppError(400, 'معلمات الاستعلام غير صالحة', parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })));
  }

  const limit = parsed.data.limit || 20;
  const offset = parsed.data.offset || 0;
  const result = await centersService.getAllCenters({ limit, offset });
  res.status(200).json({ success: true, data: result.data, page: result.page, total: result.total });
}

async function getCenter(req, res) {
  const parsed = centerIdSchema.safeParse(req.params || {});
  if (!parsed.success) {
    throw new AppError(400, 'معرف المركز غير صالح', parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })));
  }

  const center = await centersService.getCenterById(parsed.data.id);
  res.status(200).json({ success: true, data: center });
}

async function addCenter(req, res) {
  const parsed = createCenterSchema.safeParse(req.body || {});
  if (!parsed.success) {
    throw new AppError(400, 'بيانات المركز غير صالحة', parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })));
  }

  const center = await centersService.createCenter({
    ...parsed.data,
    createdBy: req.user.uid,
  });

  res.status(201).json({ success: true, data: center });
}

async function editCenter(req, res) {
  const params = centerIdSchema.safeParse(req.params || {});
  if (!params.success) {
    throw new AppError(400, 'معرف المركز غير صالح', params.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })));
  }

  const body = updateCenterSchema.safeParse(req.body || {});
  if (!body.success) {
    throw new AppError(400, 'بيانات التحديث غير صالحة', body.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })));
  }

  const center = await centersService.updateCenter(params.data.id, body.data);
  res.status(200).json({ success: true, data: center });
}

async function removeCenter(req, res) {
  const parsed = centerIdSchema.safeParse(req.params || {});
  if (!parsed.success) {
    throw new AppError(400, 'معرف المركز غير صالح', parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })));
  }

  await centersService.deleteCenter(parsed.data.id);
  res.status(200).json({ success: true, message: 'تم حذف المركز' });
}

module.exports = {
  getCenters: asyncHandler(getCenters),
  getCenter: asyncHandler(getCenter),
  addCenter: asyncHandler(addCenter),
  editCenter: asyncHandler(editCenter),
  removeCenter: asyncHandler(removeCenter),
};
