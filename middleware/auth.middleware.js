const admin = require('../config/firebaseAdmin');
const AppError = require('./AppError');

function extractToken(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  return header.split('Bearer ')[1];
}

async function verifyToken(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return next(new AppError(401, 'يجب تسجيل الدخول لاستخدام هذه الميزة'));
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    next(new AppError(401, 'جلسة الدخول غير صالحة أو منتهية، الرجاء تسجيل الدخول مجددًا'));
  }
}

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
    req.user = null;
  }
  next();
}

function requireAdmin(req, res, next) {
  const adminClaim = req.user && req.user.admin === true;

  if (!req.user || !adminClaim) {
    return next(new AppError(403, 'هذه العملية مخصصة للمشرفين فقط'));
  }

  next();
}

module.exports = { verifyToken, optionalAuth, requireAdmin };
