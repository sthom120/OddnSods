const {
  initializeApp,
  cert,
  getApps,
} = require("firebase-admin/app");

const serviceAccount = require(
  "./firebase-service-account.json"
);

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

module.exports = require(
  "firebase-admin/messaging"
).getMessaging();