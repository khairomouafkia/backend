const admin = require('firebase-admin');

// يدعم طريقتين لتحميل مفتاح الخدمة:
// 1) FIREBASE_SERVICE_ACCOUNT_JSON : محتوى JSON كامل (مفيد في الاستضافة مثل Render/Vercel)
// 2) FIREBASE_SERVICE_ACCOUNT_PATH : مسار ملف محلي (مفيد أثناء التطوير)
function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json';
  return require(require('path').resolve(path));
}

if (!admin.apps.length) {
  try {
    const serviceAccount = loadServiceAccount();
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (err) {
    console.warn('⚠️  لم يتم تحميل مفتاح Firebase الإداري:', err.message);
    console.warn('   تأكد من وجود serviceAccountKey.json أو FIREBASE_SERVICE_ACCOUNT_JSON في .env');
  }
}

module.exports = admin;
