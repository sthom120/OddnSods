const express = require("express");

const {
  registerInstallation,
  unregisterInstallation,
  sendTestNotification,
} = require(
  "../controllers/notificationController"
);

const protect = require(
  "../middleware/authMiddleware"
);

const router = express.Router();

router.use(protect);

router.post(
  "/register",
  registerInstallation
);

router.delete(
  "/unregister",
  unregisterInstallation
);

router.post(
  "/test",
  sendTestNotification
);

module.exports = router;
