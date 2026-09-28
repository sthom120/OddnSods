const User = require(
  "../models/User"
);

const messaging = require(
  "../config/firebaseAdmin"
);

const sendNotificationToUser =
  async ({
    userId,
    title,
    body,
    data,
    logLabel,
  }) => {
    try {
      const user =
        await User.findById(userId);

      if (!user) {
        console.log(
          `${logLabel} skipped: recipient user not found.`
        );

        return {
          sent: 0,
          failed: 0,
        };
      }

      if (
        !user
          .notificationInstallations
          ?.length
      ) {
        console.log(
          `${logLabel} skipped: ${user.email} has no registered notification installations.`
        );

        return {
          sent: 0,
          failed: 0,
        };
      }

      let sent = 0;
      let failed = 0;

      for (
        const installation of
        user.notificationInstallations
      ) {
        try {
          const response =
            await messaging.send({
              fid: installation.fid,
              notification: {
                title,
                body,
              },
              data,
            });

          sent += 1;

          console.log(
            `${logLabel} sent to ${user.email}:`,
            response
          );
        } catch (error) {
          failed += 1;

          console.error(
            `${logLabel} failed for ${user.email}:`,
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
        `${logLabel} service failed:`,
        error
      );

      return {
        sent: 0,
        failed: 1,
      };
    }
  };

const sendAssignmentNotification =
  async ({
    assignedUserId,
    assignedByName,
    itemTitle,
    listName,
    listId,
  }) => {
    const messageBody =
      `${assignedByName} assigned you ` +
      `"${itemTitle}" in ${listName}`;

    return sendNotificationToUser({
      userId: assignedUserId,
      title: "OddsnSods",
      body: messageBody,
      data: {
        type: "assignment",
        listId: listId.toString(),
      },
      logLabel:
        "Assignment notification",
    });
  };

const sendDueDateNotification =
  async ({
    userId,
    itemTitle,
    listName,
    listId,
  }) => {
    return sendNotificationToUser({
      userId,
      title: "Due today",
      body:
        `"${itemTitle}" is due today in ${listName}.`,
      data: {
        type: "due-date",
        listId: listId.toString(),
      },
      logLabel:
        "Due date notification",
    });
  };

module.exports = {
  sendAssignmentNotification,
  sendDueDateNotification,
};
