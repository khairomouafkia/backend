const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('⚠️  GEMINI_API_KEY غير موجود في ملف .env');
}

const genAI = new GoogleGenerativeAI(apiKey);

// النموذج المستخدم للمحادثة (يمكن تغييره حسب الحاجة)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

module.exports = model;
