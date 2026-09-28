// طريقة الاستخدام:
//   node scripts/setAdmin.js <uid-or-email>
//
// هذا السكريبت يمنح المستخدم صلاحية admin عبر Firebase custom claims
// بعدها، أي توكن يصدره Firebase لهذا المستخدم سيحتوي على admin: true
// (على المستخدم تسجيل الخروج والدخول مجددًا، أو تحديث التوكن، ليأخذ الصلاحية)

require('dotenv').config();
const admin = require('../config/firebaseAdmin');

async function main() {
  const identifier = process.argv[2];

  if (!identifier) {
    console.error('❌ استخدم: node scripts/setAdmin.js <uid-or-email>');
    process.exit(1);
  }

  try {
    const user = identifier.includes('@')
      ? await admin.auth().getUserByEmail(identifier)
      : await admin.auth().getUser(identifier);

    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log(`✅ تم منح صلاحية admin للمستخدم: ${user.email || user.uid}`);
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  }
}

main();
