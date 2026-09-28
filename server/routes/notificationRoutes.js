const express = require("express");

const {
  registerInstallation,
  unregisterInstallation,
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

module.exports = router;
