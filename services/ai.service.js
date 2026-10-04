const { model, modelName } = require('../config/gemini');
const AppError = require('../middleware/AppError');

const SYSTEM_CONTEXT = `أنت مساعد ذكي في تطبيق "أكتوبر الوردي" لتوعية النساء حول
الكشف المبكر عن سرطان الثدي. أجب بلطف ووضوح وباللغة العربية.`;

function normalizeHistory(history = []) {
  return (Array.isArray(history) ? history : []).map((entry) => {
    const role = entry && entry.role === 'user' ? 'user' : 'model';
    const text = typeof entry?.content === 'string'
      ? entry.content
      : typeof entry?.text === 'string'
        ? entry.text
        : '';

    return {
      role,
      parts: [{ text: String(text).slice(0, 2000) }],
    };
  });
}

async function getChatResponse(message, history = [], retries = 0) {
  if (typeof message !== 'string' || !message.trim()) {
    throw new AppError(400, 'رسالة المحادثة غير صالحة');
  }

  const formattedHistory = normalizeHistory(history);

  try {
    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: SYSTEM_CONTEXT }] },
        { role: 'model', parts: [{ text: 'حسنًا، أنا جاهز للمساعدة.' }] },
        ...formattedHistory,
      ],
    });

    const result = await Promise.race([
      chat.sendMessage(message),
      new Promise((_, reject) => setTimeout(() => reject(new Error('GEMINI_TIMEOUT')), 25000)),
    ]);

    const response = await result.response;
    return response.text();
  } catch (error) {
    const status = Number(error?.status ?? error?.statusCode ?? 0);
    const details = [
      {
        code: error?.code || 'GEMINI_REQUEST_FAILED',
        message: error?.message || 'Gemini request failed',
      },
    ];

    const isTransient = error?.message === 'GEMINI_TIMEOUT' || status === 429 || status === 500 || status === 503;

    if (isTransient && retries < 2) {
      return getChatResponse(message, history, retries + 1);
    }

    if (status === 429 || status === 503 || error?.message === 'GEMINI_TIMEOUT') {
      throw new AppError(503, 'خدمة المساعد غير متاحة حاليًا، حاول مرة أخرى بعد قليل', details);
    }

    if (status === 404 || /not found|not available|unsupported|model.*not.*found|invalid model/i.test(String(error?.message || ''))) {
      throw new AppError(
        502,
        'تعذّر تجهيز رد المساعد',
        [{
          code: 'GEMINI_MODEL_NOT_FOUND',
          message: `Configured model is invalid or unavailable for this API key/account: ${modelName}`,
        }]
      );
    }

    throw new AppError(502, 'تعذّر تجهيز رد المساعد', details);
  }
}

module.exports = { getChatResponse };
