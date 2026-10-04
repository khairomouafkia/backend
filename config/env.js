require('dotenv').config();
const fs = require('fs');
const path = require('path');

const toList = (value) => String(value || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const NODE_ENV = process.env.NODE_ENV || 'development';
const requiredNames = [
  'PORT',
  'SUPABASE_URL',
  'SUPABASE_KEY',
  'GEMINI_API_KEY',
  'ALLOWED_ORIGINS',
];

const missing = requiredNames.filter((name) => {
  const value = process.env[name];
  return !value || String(value).trim() === '';
});

const hasFirebaseCredentials = Boolean(
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT_PATH
);

if (hasFirebaseCredentials === false) {
  missing.push('FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH');
}

if (missing.length) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

const port = Number(process.env.PORT);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be a valid integer between 1 and 65535.');
}

const allowedOrigins = toList(process.env.ALLOWED_ORIGINS);
if (NODE_ENV === 'production' && allowedOrigins.length === 0) {
  throw new Error('ALLOWED_ORIGINS must include the production frontend origins when NODE_ENV is production.');
}

if (NODE_ENV === 'production' && allowedOrigins.includes('*')) {
  throw new Error('Wildcard CORS origins are not allowed in production.');
}

let firebaseServiceAccount = null;
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    firebaseServiceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } catch (error) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.');
  }
}

const firebaseServiceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json';
const resolvedPath = path.resolve(firebaseServiceAccountPath);
if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON && !fs.existsSync(resolvedPath)) {
  throw new Error(`Firebase service account file not found: ${resolvedPath}`);
}

module.exports = {
  NODE_ENV,
  PORT: port,
  SUPABASE_URL: process.env.SUPABASE_URL.trim(),
  SUPABASE_KEY: process.env.SUPABASE_KEY.trim(),
  GEMINI_API_KEY: process.env.GEMINI_API_KEY.trim(),
  ALLOWED_ORIGINS: allowedOrigins,
  FIREBASE_SERVICE_ACCOUNT_JSON: firebaseServiceAccount,
  FIREBASE_SERVICE_ACCOUNT_PATH: firebaseServiceAccountPath,
  isProduction: NODE_ENV === 'production',
};
