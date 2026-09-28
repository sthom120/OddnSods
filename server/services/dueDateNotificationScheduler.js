const {
  runDueDateNotificationCycle,
} = require(
  "./dueDateNotificationService"
);

const {
  getCheckIntervalMinutes,
} = require(
  "../utils/dueNotificationUtils"
);

let cycleRunning = false;

const runCycleSafely = async () => {
  if (cycleRunning) {
    return;
  }

  cycleRunning = true;

  try {
    const result =
      await runDueDateNotificationCycle();

    if (!result.skipped) {
      console.log(
        "Due notification cycle complete:",
        result
      );
    }
  } catch (error) {
    console.error(
      "Due notification cycle failed:",
      error
    );
  } finally {
    cycleRunning = false;
  }
};

const startDueDateNotificationScheduler =
  () => {
    if (
      process.env
        .DUE_NOTIFICATIONS_ENABLED !==
      "true"
    ) {
      console.log(
        "Due date notifications are disabled."
      );

      return null;
    }

    const intervalMinutes =
      getCheckIntervalMinutes(
        process.env
          .DUE_NOTIFICATION_CHECK_MINUTES
      );

    console.log(
      `Due date notifications enabled; checking every ${intervalMinutes} minute(s).`
    );

    void runCycleSafely();

    return setInterval(
      () => {
        void runCycleSafely();
      },
      intervalMinutes * 60 * 1000
    );
  };

module.exports = {
  startDueDateNotificationScheduler,
};
