const aiService = require('../services/ai.service');

// POST /api/ai/chat
async function chat(req, res, next) {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'message مطلوب',
      });
    }

    const reply = await aiService.getChatResponse(message, history || []);
    res.status(200).json({ success: true, response: reply });
  } catch (error) {
    next(error);
  }
}

module.exports = { chat };
