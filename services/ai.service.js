const model = require('../config/gemini');

// تعليمات النظام الخاصة بالمساعد (شخصية المساعد، الموضوع، اللغة...)
const SYSTEM_CONTEXT = `أنت مساعد ذكي في تطبيق "أكتوبر الوردي" لتوعية النساء حول
الكشف المبكر عن سرطان الثدي. أجب بلطف ووضوح وباللغة العربية.`;

// إرسال رسالة مع سجل المحادثة السابق
async function getChatResponse(message, history = []) {
  // نحوّل السجل إلى الصيغة التي يتوقعها Gemini
  const formattedHistory = history.map((h) => ({
    role: h.role === 'user' ? 'user' : 'model',
    parts: [{ text: h.content || h.text || '' }],
  }));

  const chat = model.startChat({
    history: [
      { role: 'user', parts: [{ text: SYSTEM_CONTEXT }] },
      { role: 'model', parts: [{ text: 'حسنًا، أنا جاهز للمساعدة.' }] },
      ...formattedHistory,
    ],
  });

  const result = await chat.sendMessage(message);
  const response = await result.response;
  return response.text();
}

module.exports = { getChatResponse };
