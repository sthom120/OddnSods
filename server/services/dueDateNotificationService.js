const mongoose = require("mongoose");

const Item = require("../models/Item");

const {
  sendDueDateNotification,
} = require("./notificationService");

const {
  generateDueRecurringItemsForAllLists,
} = require("./recurrenceService");

const {
  getDateKeyFromValue,
  getZonedDateParts,
} = require("../utils/dateUtils");

const {
  getDueNotificationRecipientIds,
  getNotificationHour,
} = require(
  "../utils/dueNotificationUtils"
);

const claimReminderForRecipient =
  async ({
    itemId,
    dateKey,
    recipientId,
  }) => {
    const recipientObjectId =
      new mongoose.Types.ObjectId(
        recipientId
      );

    const claimed =
      await Item.findOneAndUpdate(
        {
          _id: itemId,
          completed: false,
          dueDateKey: dateKey,
          $or: [
            {
              dueReminderDateKey: {
                $ne: dateKey,
              },
            },
            {
              dueReminderSentTo: {
                $ne: recipientObjectId,
              },
            },
          ],
        },
        [
          {
            $set: {
              dueReminderDateKey:
                dateKey,
              dueReminderSentTo: {
                $cond: [
                  {
                    $eq: [
                      "$dueReminderDateKey",
                      dateKey,
                    ],
                  },
                  {
                    $setUnion: [
                      {
                        $ifNull: [
                          "$dueReminderSentTo",
                          [],
                        ],
                      },
                      [recipientObjectId],
                    ],
                  },
                  [recipientObjectId],
                ],
              },
            },
          },
        ],
        {
          new: true,
          updatePipeline: true,
        }
      );

    return Boolean(claimed);
  };

const releaseReminderClaim = async ({
  itemId,
  dateKey,
  recipientId,
}) => {
  await Item.updateOne(
    {
      _id: itemId,
      dueReminderDateKey: dateKey,
    },
    {
      $pull: {
        dueReminderSentTo:
          recipientId,
      },
    }
  );
};

const runDueDateNotificationCycle =
  async (now = new Date()) => {
    const timeZone =
      process.env.APP_TIME_ZONE ||
      "Australia/Brisbane";

    const notificationHour =
      getNotificationHour(
        process.env
          .DUE_NOTIFICATION_HOUR
      );

    const zonedNow =
      getZonedDateParts(
        now,
        timeZone
      );

    if (
      zonedNow.hour <
      notificationHour
    ) {
      return {
        skipped: true,
        reason:
          "before-notification-hour",
        dateKey: zonedNow.dateKey,
        sent: 0,
        failed: 0,
      };
    }

    const recurringItemsCreated =
      await generateDueRecurringItemsForAllLists(
        now
      );

    const candidates = await Item.find({
      completed: false,
      dueDate: {
        $ne: null,
      },
      $or: [
        {
          dueDateKey:
            zonedNow.dateKey,
        },
        {
          dueDateKey: null,
        },
      ],
    }).populate({
      path: "listId",
      select:
        "name owner members settings",
    });

    let sent = 0;
    let failed = 0;

    for (const item of candidates) {
      const dueDateKey =
        item.dueDateKey ||
        getDateKeyFromValue(
          item.dueDate
        );

      if (!dueDateKey) {
        continue;
      }

      if (!item.dueDateKey) {
        await Item.updateOne(
          {
            _id: item._id,
            dueDateKey: null,
          },
          {
            $set: {
              dueDateKey,
            },
          }
        );
      }

      if (
        dueDateKey !==
        zonedNow.dateKey
      ) {
        continue;
      }

      const list = item.listId;

      if (
        !list ||
        !list.settings
          ?.dueDatesEnabled
      ) {
        continue;
      }

      const assignedTo =
        list.settings
          ?.assignmentEnabled
          ? item.assignedTo
          : null;

      const recipientIds =
        getDueNotificationRecipientIds(
          list,
          assignedTo
        );

      for (
        const recipientId of
        recipientIds
      ) {
        const claimed =
          await claimReminderForRecipient({
            itemId: item._id,
            dateKey:
              zonedNow.dateKey,
            recipientId,
          });

        if (!claimed) {
          continue;
        }

        const result =
          await sendDueDateNotification({
            userId: recipientId,
            itemTitle: item.title,
            listName: list.name,
            listId: list._id,
          });

        if (result.sent > 0) {
          sent += 1;
        } else {
          failed += 1;

          await releaseReminderClaim({
            itemId: item._id,
            dateKey:
              zonedNow.dateKey,
            recipientId,
          });
        }
      }
    }

    return {
      skipped: false,
      dateKey: zonedNow.dateKey,
      recurringItemsCreated,
      sent,
      failed,
    };
  };

module.exports = {
  runDueDateNotificationCycle,
};
