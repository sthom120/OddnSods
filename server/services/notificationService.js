const User = require("../models/User");
const messaging = require("../config/firebaseAdmin");

const sendAssignmentNotification = async ({
  assignedUserId,
  assignedByName,
  itemTitle,
  listName,
  listId,
}) => {
  try {
    const user = await User.findById(
      assignedUserId
    );

    if (
      !user ||
      !user.notificationInstallations?.length
    ) {
      return;
    }

    const messageBody =
      `${assignedByName} assigned you ` +
      `"${itemTitle}" in ${listName}`;

    for (const installation of user.notificationInstallations) {
      try {
        await messaging.send({
          fid: installation.fid,

          notification: {
            title: "OddsnSods",
            body: messageBody,
          },

          data: {
            type: "assignment",
            listId: listId.toString(),
          },
        });
      } catch (error) {
        console.error(
          "Failed to send notification to installation:",
          error.message
        );
      }
    }
  } catch (error) {
    console.error(
      "Assignment notification failed:",
      error.message
    );
  }
};

module.exports = {
  sendAssignmentNotification,
};