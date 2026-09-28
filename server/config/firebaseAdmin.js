const fs = require("fs");
const path = require("path");

const {
  initializeApp,
  cert,
  getApps,
} = require("firebase-admin/app");

const getServiceAccount = () => {
  const {
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY,
  } = process.env;

  if (
    FIREBASE_PROJECT_ID &&
    FIREBASE_CLIENT_EMAIL &&
    FIREBASE_PRIVATE_KEY
  ) {
    return {
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: FIREBASE_PRIVATE_KEY.replace(
        /\\n/g,
        "\n"
      ),
    };
  }

  const localServiceAccountPath = path.join(
    __dirname,
    "firebase-service-account.json"
  );

  if (
    fs.existsSync(localServiceAccountPath)
  ) {
    return require(
      localServiceAccountPath
    );
  }

  throw new Error(
    "Firebase Admin credentials are not configured."
  );
};

if (!getApps().length) {
  initializeApp({
    credential: cert(
      getServiceAccount()
    ),
  });
}

module.exports = require(
  "firebase-admin/messaging"
).getMessaging();
