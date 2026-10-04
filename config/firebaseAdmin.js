const admin = require('firebase-admin');
const path = require('path');
const { FIREBASE_SERVICE_ACCOUNT_JSON, FIREBASE_SERVICE_ACCOUNT_PATH } = require('./env');

function loadServiceAccount() {
  if (FIREBASE_SERVICE_ACCOUNT_JSON) {
    return FIREBASE_SERVICE_ACCOUNT_JSON;
  }

  const serviceAccountPath = path.resolve(FIREBASE_SERVICE_ACCOUNT_PATH);
  return require(serviceAccountPath);
}

if (!admin.apps.length) {
  const serviceAccount = loadServiceAccount();
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;
