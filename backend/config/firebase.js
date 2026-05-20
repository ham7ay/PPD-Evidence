const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // Render / production: read from env var
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  // Local: read from file
  const keyPath = path.join(__dirname, 'serviceAccountKey.json');
  if (!fs.existsSync(keyPath)) {
    console.error('❌ Missing backend/config/serviceAccountKey.json. See README step 5.');
    process.exit(1);
  }
  serviceAccount = require(keyPath);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
