const Item = require("../models/Item");
const List = require("../models/List");

const {
  dateKeyToDate,
  getDateKeyFromValue,
  getTodayDateKey,
} = require("../utils/dateUtils");

const assigneeStillHasAccess = (
  list,
  assignedTo
) => {
  if (!assignedTo) {
    return true;
  }

  const assignedId =
    assignedTo.toString();

  if (
    list.owner.toString() ===
    assignedId
  ) {
    return true;
  }

  return list.members.some(
    (memberId) =>
      memberId.toString() ===
      assignedId
  );
};

const generateDueRecurringItems =
  async (
    listId,
    now = new Date()
  ) => {
    const list = await List.findById(
      listId
    ).select("owner members");

    if (!list) {
      return 0;
    }

    const todayDateKey =
      getTodayDateKey(now);

    const recurringCandidates =
      await Item.find({
        listId,
        completed: true,
        recurrence: {
          $ne: null,
        },
        nextOccurrenceCreated: false,
        $or: [
          {
            nextOccurrenceDateKey: {
              $ne: null,
            },
          },
          {
            nextOccurrenceDate: {
              $ne: null,
            },
          },
        ],
      });

    let created = 0;

    for (
      const oldItem of
      recurringCandidates
    ) {
      const nextDateKey =
        oldItem.nextOccurrenceDateKey ||
        getDateKeyFromValue(
          oldItem.nextOccurrenceDate
        );

      if (
        !nextDateKey ||
        nextDateKey > todayDateKey
      ) {
        continue;
      }

      const copiedAssignee =
        assigneeStillHasAccess(
          list,
          oldItem.assignedTo
        )
          ? oldItem.assignedTo
          : null;

      try {
        await Item.create({
          listId: oldItem.listId,
          title: oldItem.title,
          dueDate:
            oldItem.nextOccurrenceDate ||
            dateKeyToDate(nextDateKey),
          dueDateKey: nextDateKey,
          assignedTo:
            copiedAssignee,
          recurrence:
            oldItem.recurrence,
          createdBy:
            oldItem.createdBy,
          previousOccurrenceId:
            oldItem._id,
        });

        created += 1;
      } catch (error) {
        if (error?.code !== 11000) {
          throw error;
        }
      }

      await Item.updateOne(
        {
          _id: oldItem._id,
        },
        {
          $set: {
            nextOccurrenceCreated: true,
            nextOccurrenceDateKey:
              nextDateKey,
          },
        }
      );
    }

    return created;
  };

const generateDueRecurringItemsForAllLists =
  async (now = new Date()) => {
    const listIds = await Item.distinct(
      "listId",
      {
        completed: true,
        recurrence: {
          $ne: null,
        },
        nextOccurrenceCreated: false,
        $or: [
          {
            nextOccurrenceDateKey: {
              $ne: null,
            },
          },
          {
            nextOccurrenceDate: {
              $ne: null,
            },
          },
        ],
      }
    );

    let created = 0;

    for (const listId of listIds) {
      created +=
        await generateDueRecurringItems(
          listId,
          now
        );
    }

    return created;
  };

module.exports = {
  generateDueRecurringItems,
  generateDueRecurringItemsForAllLists,
};
