const User = require(
  "../models/User"
);

const messaging = require(
  "../config/firebaseAdmin"
);

// ------------------------------------
// REGISTER THIS BROWSER TO THIS USER
// ------------------------------------

const registerInstallation =
  async (req, res) => {
    try {
      const { fid } = req.body;

      if (!fid) {
        return res
          .status(400)
          .json({
            message:
              "Firebase installation ID is required",
          });
      }

      await User.updateMany(
        {
          _id: {
            $ne: req.user._id,
          },

          "notificationInstallations.fid":
            fid,
        },
        {
          $pull: {
            notificationInstallations: {
              fid,
            },
          },
        }
      );

      const user =
        await User.findById(
          req.user._id
        );

      if (!user) {
        return res
          .status(404)
          .json({
            message:
              "User not found",
          });
      }

      const existingInstallation =
        user
          .notificationInstallations
          .find(
            (installation) =>
              installation.fid ===
              fid
          );

      if (
        existingInstallation
      ) {
        existingInstallation
          .updatedAt =
          new Date();
      } else {
        user
          .notificationInstallations
          .push({
            fid,
            updatedAt:
              new Date(),
          });
      }

      await user.save();

      console.log(
        `Notifications registered for ${user.email}`
      );

      res.json({
        message:
          "Notifications registered",
      });
    } catch (error) {
      console.error(
        "Notification registration failed:",
        error
      );

      res.status(500).json({
        message:
          error.message,
      });
    }
  };

// ------------------------------------
// UNREGISTER THIS BROWSER FROM USER
// ------------------------------------

const unregisterInstallation =
  async (req, res) => {
    try {
      const { fid } = req.body;

      if (!fid) {
        return res
          .status(400)
          .json({
            message:
              "Firebase installation ID is required",
          });
      }

      await User.updateOne(
        {
          _id: req.user._id,
        },
        {
          $pull: {
            notificationInstallations: {
              fid,
            },
          },
        }
      );

      res.json({
        message:
          "Notifications unregistered",
      });
    } catch (error) {
      console.error(
        "Notification unregister failed:",
        error
      );

      res.status(500).json({
        message:
          error.message,
      });
    }
  };

// ------------------------------------
// TEMPORARY TEST NOTIFICATION
// ------------------------------------

const sendTestNotification =
  async (req, res) => {
    try {
      const user =
        await User.findById(
          req.user._id
        );

      if (!user) {
        return res
          .status(404)
          .json({
            message:
              "User not found",
          });
      }

      if (
        !user
          .notificationInstallations
          ?.length
      ) {
        return res
          .status(400)
          .json({
            message:
              "No notification installation registered",
          });
      }

      const results = [];

      for (
        const installation of
        user
          .notificationInstallations
      ) {
        try {
          const response =
            await messaging.send({
              fid:
                installation.fid,

              notification: {
                title:
                  "OddsnSods",

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
            error:
              error.message,
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
        message:
          error.message,
      });
    }
  };

module.exports = {
  registerInstallation,
  unregisterInstallation,
  sendTestNotification,
};
