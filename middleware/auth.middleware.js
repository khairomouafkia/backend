const admin = require('../config/firebaseAdmin');

// يستخرج التوكن من الهيدر: Authorization: Bearer <idToken>
function extractToken(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  return header.split('Bearer ')[1];
}

// إجباري: يُستخدم في المسارات التي تتطلب تسجيل دخول
// (مثال: chat bot، التسجيل في فعالية، نشر منشور)
async function verifyToken(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'يجب تسجيل الدخول لاستخدام هذه الميزة',
    });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded; // يحتوي uid, email, admin (إن وُجد كـ custom claim)
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'جلسة الدخول غير صالحة أو منتهية، الرجاء تسجيل الدخول مجددًا',
    });
  }
}

// اختياري: لا يمنع الطلب إن لم يكن هناك توكن (وضع الزائر)
// لكن إن وُجد توكن صالح، يُرفق req.user لتُستخدم لاحقًا إن لزم
async function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
  } catch (error) {
    req.user = null; // توكن غير صالح لا يمنع الوصول كزائر
  }
  next();
}

// يُستخدم بعد verifyToken فقط - يتحقق من custom claim: admin === true
function requireAdmin(req, res, next) {
  const adminClaim = req.user && (req.user.admin === true || req.user.role === 'admin');

  if (!req.user || !adminClaim) {
    return res.status(403).json({
      success: false,
      message: 'هذه العملية مخصصة للمشرفين فقط',
    });
  }

  next();
}

module.exports = { verifyToken, optionalAuth, requireAdmin };
