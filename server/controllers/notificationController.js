const User = require(
  "../models/User"
);

// ------------------------------------
// REGISTER THIS BROWSER TO THIS USER
// ------------------------------------

const registerInstallation =
  async (req, res) => {
    try {
      const {
        fid,
        previousFid,
      } = req.body;

      if (!fid) {
        return res
          .status(400)
          .json({
            message:
              "Firebase installation ID is required",
          });
      }

      if (
        previousFid &&
        previousFid !== fid
      ) {
        await User.updateOne(
          {
            _id: req.user._id,
          },
          {
            $pull: {
              notificationInstallations: {
                fid: previousFid,
              },
            },
          }
        );
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
        message: error.message,
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
        message: error.message,
      });
    }
  };

module.exports = {
  registerInstallation,
  unregisterInstallation,
};
