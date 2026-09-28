const express = require("express");

const {
  registerInstallation,
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

router.post(
  "/test",
  sendTestNotification
);

module.exports = router;