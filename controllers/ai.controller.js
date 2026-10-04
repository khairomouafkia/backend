const { z } = require('zod');
const aiService = require('../services/ai.service');
const AppError = require('../middleware/AppError');
const asyncHandler = require('../middleware/asyncHandler');

const chatSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string().optional(),
    text: z.string().optional(),
  })).max(20).optional().default([]),
}).strict();

async function chat(req, res) {
  const parsed = chatSchema.safeParse(req.body || {});
  if (!parsed.success) {
    throw new AppError(400, 'بيانات الرسالة غير صالحة', parsed.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    })));
  }

  const { message, history } = parsed.data;
  const reply = await aiService.getChatResponse(message, history || []);
  res.status(200).json({ success: true, data: { response: reply } });
}

module.exports = { chat: asyncHandler(chat) };
