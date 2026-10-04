const { z } = require('zod');
const screeningsService = require('../services/screenings.service');
const AppError = require('../middleware/AppError');
const asyncHandler = require('../middleware/asyncHandler');

const screeningTypeEnum = z.enum(['mammogram', 'ultrasound', 'clinical_exam', 'screening', 'mri', 'self_exam']);

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
}).passthrough();

const createScreeningSchema = z.object({
  screeningType: screeningTypeEnum,
  scheduledDate: z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'scheduledDate يجب أن يكون ISO date صالح',
  }),
  notes: z.string().trim().max(1000).optional(),
}).strict();

const updateScreeningSchema = z.object({
  screeningType: screeningTypeEnum.optional(),
  scheduledDate: z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'scheduledDate يجب أن يكون ISO date صالح',
  }).optional(),
  notes: z.string().trim().max(1000).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: 'يجب إرسال حقل واحد على الأقل للتحديث',
});

async function getScreenings(req, res) {
  const tokenUserId = req.user && req.user.uid;
  const requestedUserId = req.params.userId;

  if (!tokenUserId) {
    throw new AppError(401, 'يجب تسجيل الدخول لاستخدام هذه الميزة');
  }

  if (requestedUserId && requestedUserId !== tokenUserId) {
    throw new AppError(403, 'لا يمكنك الوصول إلى بيانات مستخدم آخر');
  }

  const parsed = listQuerySchema.safeParse(req.query || {});
  if (!parsed.success) {
    throw new AppError(400, 'معلمات الاستعلام غير صالحة', parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })));
  }

  const limit = parsed.data.limit || 20;
  const offset = parsed.data.offset || 0;
  const result = await screeningsService.getUserScreenings(tokenUserId, { limit, offset });
  res.status(200).json({ success: true, data: result.data, page: result.page, total: result.total });
}

async function addScreening(req, res) {
  const userId = req.user && req.user.uid;
  if (!userId) {
    throw new AppError(401, 'يجب تسجيل الدخول لاستخدام هذه الميزة');
  }

  const parsed = createScreeningSchema.safeParse(req.body || {});
  if (!parsed.success) {
    throw new AppError(400, 'بيانات الموعد غير صالحة', parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })));
  }

  const newScreening = await screeningsService.createScreening({
    userId,
    screeningType: parsed.data.screeningType,
    scheduledDate: parsed.data.scheduledDate,
    notes: parsed.data.notes,
  });

  res.status(201).json({ success: true, data: newScreening });
}

async function editScreening(req, res) {
  const userId = req.user && req.user.uid;
  if (!userId) {
    throw new AppError(401, 'يجب تسجيل الدخول لاستخدام هذه الميزة');
  }

  const params = z.object({ id: z.string().trim().min(1) }).safeParse(req.params || {});
  if (!params.success) {
    throw new AppError(400, 'معرف الموعد غير صالح');
  }

  const parsed = updateScreeningSchema.safeParse(req.body || {});
  if (!parsed.success) {
    throw new AppError(400, 'بيانات التحديث غير صالحة', parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })));
  }

  const screening = await screeningsService.updateScreening(userId, params.data.id, parsed.data);
  res.status(200).json({ success: true, data: screening });
}

async function removeScreening(req, res) {
  const userId = req.user && req.user.uid;
  if (!userId) {
    throw new AppError(401, 'يجب تسجيل الدخول لاستخدام هذه الميزة');
  }

  const params = z.object({ id: z.string().trim().min(1) }).safeParse(req.params || {});
  if (!params.success) {
    throw new AppError(400, 'معرف الموعد غير صالح');
  }

  await screeningsService.deleteScreening(userId, params.data.id);
  res.status(200).json({ success: true, message: 'تم حذف الموعد' });
}

module.exports = {
  getScreenings: asyncHandler(getScreenings),
  addScreening: asyncHandler(addScreening),
  editScreening: asyncHandler(editScreening),
  removeScreening: asyncHandler(removeScreening),
};