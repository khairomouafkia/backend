require('dotenv').config();
const admin = require('../config/firebaseAdmin');

async function main() {
  const identifier = process.argv[2];

  if (!identifier) {
    console.error('Usage: node scripts/set-admin.js <uid-or-email>');
    process.exit(1);
  }

  try {
    const user = identifier.includes('@')
      ? await admin.auth().getUserByEmail(identifier)
      : await admin.auth().getUser(identifier);

    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log(`Admin claim granted for: ${user.email || user.uid}`);
  } catch (error) {
    console.error('Failed to set admin claim:', error.message);
    process.exit(1);
  }
}

main();
