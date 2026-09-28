const User = require("../models/User");
const messaging = require(
  "../config/firebaseAdmin"
);

const registerInstallation = async (
  req,
  res
) => {
  try {
    const { fid } = req.body;

    if (!fid) {
      return res.status(400).json({
        message:
          "Firebase installation ID is required",
      });
    }

    const user = await User.findById(
      req.user._id
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const existingInstallation =
      user.notificationInstallations.find(
        (installation) =>
          installation.fid === fid
      );

    if (existingInstallation) {
      existingInstallation.updatedAt =
        new Date();
    } else {
      user.notificationInstallations.push({
        fid,
        updatedAt: new Date(),
      });
    }

    await user.save();

    res.json({
      message:
        "Notifications registered",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const sendTestNotification = async (
  req,
  res
) => {
  try {
    const user = await User.findById(
      req.user._id
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (
      !user.notificationInstallations?.length
    ) {
      return res.status(400).json({
        message:
          "No notification installation registered",
      });
    }

    const results = [];

    for (
      const installation of
      user.notificationInstallations
    ) {
      try {
        const response =
          await messaging.send({
            fid: installation.fid,

            notification: {
              title: "OddsnSods",
              body:
                "Notifications are working 🎉",
            },

            data: {
              type: "test",
            },
          });

        results.push({
          success: true,
          response,
        });
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
        });
      }
    }

    res.json({
      message:
        "Test notification attempted",
      results,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  registerInstallation,
  sendTestNotification,
};