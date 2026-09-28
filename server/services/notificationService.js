const User = require(
  "../models/User"
);

const messaging = require(
  "../config/firebaseAdmin"
);

const sendAssignmentNotification =
  async ({
    assignedUserId,
    assignedByName,
    itemTitle,
    listName,
    listId,
  }) => {
    try {
      const user =
        await User.findById(
          assignedUserId
        );

      if (!user) {
        console.log(
          "Assignment notification skipped: recipient user not found."
        );

        return {
          sent: 0,
        };
      }

      if (
        !user
          .notificationInstallations
          ?.length
      ) {
        console.log(
          `Assignment notification skipped: ${user.email} has no registered notification installations.`
        );

        return {
          sent: 0,
        };
      }

      const messageBody =
        `${assignedByName} assigned you ` +
        `"${itemTitle}" in ${listName}`;

      let sent = 0;
      let failed = 0;

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
                  messageBody,
              },

              data: {
                type:
                  "assignment",

                listId:
                  listId.toString(),
              },
            });

          sent += 1;

          console.log(
            `Assignment notification sent to ${user.email}:`,
            response
          );
        } catch (error) {
          failed += 1;

          console.error(
            `Assignment notification failed for ${user.email}:`,
            error
          );
        }
      }

      return {
        sent,
        failed,
      };
    } catch (error) {
      console.error(
        "Assignment notification service failed:",
        error
      );

      return {
        sent: 0,
        failed: 1,
      };
    }
  };

module.exports = {
  sendAssignmentNotification,
};