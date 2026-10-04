const { z } = require('zod');
const eventsService = require('../services/events.service');
const AppError = require('../middleware/AppError');
const asyncHandler = require('../middleware/asyncHandler');

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
}).passthrough();

const eventIdSchema = z.object({ id: z.string().trim().min(1) });

const createEventSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  location: z.string().trim().max(300).optional(),
  eventDate: z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'eventDate يجب أن يكون ISO date صالح',
  }),
}).strict();

const updateEventSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  location: z.string().trim().max(300).optional(),
  eventDate: z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'eventDate يجب أن يكون ISO date صالح',
  }).optional(),
}).strict();

async function getEvents(req, res) {
  const parsed = listQuerySchema.safeParse(req.query || {});
  if (!parsed.success) {
    throw new AppError(400, 'معلمات الاستعلام غير صالحة', parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })));
  }

  const limit = parsed.data.limit || 20;
  const offset = parsed.data.offset || 0;
  const result = await eventsService.getAllEvents({ limit, offset });
  res.status(200).json({ success: true, data: result.data, page: result.page, total: result.total });
}

async function getEvent(req, res) {
  const parsed = eventIdSchema.safeParse(req.params || {});
  if (!parsed.success) {
    throw new AppError(400, 'معرف الفعالية غير صالح', parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })));
  }

  const event = await eventsService.getEventById(parsed.data.id);
  res.status(200).json({ success: true, data: event });
}

async function addEvent(req, res) {
  const parsed = createEventSchema.safeParse(req.body || {});
  if (!parsed.success) {
    throw new AppError(400, 'بيانات الفعالية غير صالحة', parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })));
  }

  const event = await eventsService.createEvent({
    ...parsed.data,
    createdBy: req.user.uid,
  });

  res.status(201).json({ success: true, data: event });
}

async function editEvent(req, res) {
  const params = eventIdSchema.safeParse(req.params || {});
  if (!params.success) {
    throw new AppError(400, 'معرف الفعالية غير صالح', params.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })));
  }

  const body = updateEventSchema.safeParse(req.body || {});
  if (!body.success) {
    throw new AppError(400, 'بيانات التحديث غير صالحة', body.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })));
  }

  const event = await eventsService.updateEvent(params.data.id, body.data);
  res.status(200).json({ success: true, data: event });
}

async function removeEvent(req, res) {
  const parsed = eventIdSchema.safeParse(req.params || {});
  if (!parsed.success) {
    throw new AppError(400, 'معرف الفعالية غير صالح', parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })));
  }

  await eventsService.deleteEvent(parsed.data.id);
  res.status(200).json({ success: true, message: 'تم حذف الفعالية' });
}

async function register(req, res) {
  const parsed = eventIdSchema.safeParse(req.params || {});
  if (!parsed.success) {
    throw new AppError(400, 'معرف الفعالية غير صالح', parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })));
  }

  const registration = await eventsService.registerForEvent(parsed.data.id, req.user.uid);
  res.status(201).json({ success: true, data: registration });
}

async function getMyRegistrations(req, res) {
  const registrations = await eventsService.getUserRegistrations(req.user.uid);
  res.status(200).json({ success: true, data: registrations });
}

async function cancelRegistration(req, res) {
  const parsed = eventIdSchema.safeParse(req.params || {});
  if (!parsed.success) {
    throw new AppError(400, 'معرف الفعالية غير صالح', parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })));
  }

  await eventsService.cancelRegistration(parsed.data.id, req.user.uid);
  res.status(200).json({ success: true, message: 'تم إلغاء التسجيل في الفعالية' });
}

module.exports = {
  getEvents: asyncHandler(getEvents),
  getEvent: asyncHandler(getEvent),
  addEvent: asyncHandler(addEvent),
  editEvent: asyncHandler(editEvent),
  removeEvent: asyncHandler(removeEvent),
  register: asyncHandler(register),
  getMyRegistrations: asyncHandler(getMyRegistrations),
  cancelRegistration: asyncHandler(cancelRegistration),
};
