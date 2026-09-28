const Item = require("../models/Item");
const List = require("../models/List");

const {
  sendAssignmentNotification,
} = require("../services/notificationService");

const {
  addRecurrenceToDateKey,
  dateKeyToDate,
  getDateKeyFromValue,
  getTodayDateKey,
} = require("../utils/dateUtils");

// --------------------------------------------------
// FIND A LIST THE CURRENT USER CAN ACCESS
// --------------------------------------------------

const getAccessibleList = async (listId, userId) => {
  return List.findOne({
    _id: listId,
    $or: [
      { owner: userId },
      { members: userId },
    ],
  });
};

// --------------------------------------------------
// CALCULATE NEXT RECURRING DATE
// --------------------------------------------------

const calculateNextOccurrence = (
  dueDate,
  dueDateKey,
  recurrence
) => {
  if (!recurrence?.frequency) {
    return null;
  }

  const currentDateKey =
    dueDateKey ||
    getDateKeyFromValue(dueDate);

  if (!currentDateKey) {
    return null;
  }

  const nextDateKey =
    addRecurrenceToDateKey(
      currentDateKey,
      recurrence.frequency
    );

  if (!nextDateKey) {
    return null;
  }

  return {
    dateKey: nextDateKey,
    date: dateKeyToDate(nextDateKey),
  };
};

// --------------------------------------------------
// CHECK ASSIGNEE BELONGS TO THIS LIST
// --------------------------------------------------

const validateAssignee = (
  list,
  assignedTo
) => {
  if (!assignedTo) {
    return true;
  }

  const assignedToId =
    assignedTo.toString();

  const ownerId =
    list.owner.toString();

  const memberIds =
    list.members.map((member) =>
      member.toString()
    );

  return (
    ownerId === assignedToId ||
    memberIds.includes(assignedToId)
  );
};

// --------------------------------------------------
// GENERATE RECURRING ITEMS WHEN THEY BECOME DUE
// --------------------------------------------------

const generateDueRecurringItems =
  async (listId) => {
    const list = await List.findById(
      listId
    ).select("owner members");

    if (!list) {
      return;
    }

    // Recurrence is based on calendar dates rather
    // than UTC timestamps. This prevents a task due
    // today in Queensland from waiting until 10am.
    const todayDateKey =
      getTodayDateKey();

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

    const dueRecurringItems =
      recurringCandidates.filter(
        (item) => {
          const nextDateKey =
            item.nextOccurrenceDateKey ||
            getDateKeyFromValue(
              item.nextOccurrenceDate
            );

          return (
            nextDateKey &&
            nextDateKey <= todayDateKey
          );
        }
      );

    for (const oldItem of dueRecurringItems) {
      const nextDateKey =
        oldItem.nextOccurrenceDateKey ||
        getDateKeyFromValue(
          oldItem.nextOccurrenceDate
        );

      if (!nextDateKey) {
        continue;
      }

      const copiedAssignee =
        validateAssignee(
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
      } catch (error) {
        // A unique partial index on
        // previousOccurrenceId makes simultaneous
        // list loads safe. If another request made
        // the occurrence first, there is nothing
        // else to create here.
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
  };

// --------------------------------------------------
// GET ITEMS FOR ONE LIST
// --------------------------------------------------

const getItemsForList = async (
  req,
  res
) => {
  try {
    const list =
      await getAccessibleList(
        req.params.listId,
        req.user._id
      );

    if (!list) {
      return res.status(404).json({
        message: "List not found",
      });
    }

    await generateDueRecurringItems(
      req.params.listId
    );

    const items = await Item.find({
      listId: req.params.listId,
    })
      .populate(
        "assignedTo",
        "name email"
      )
      .populate(
        "completedBy",
        "name email"
      )
      .populate(
        "createdBy",
        "name email"
      )
      .sort({
        completed: 1,
        createdAt: 1,
      });

    res.json(items);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// --------------------------------------------------
// CREATE ITEM
// --------------------------------------------------

const createItem = async (
  req,
  res
) => {
  try {
    const {
      listId,
      title,
      dueDate,
      assignedTo,
      recurrence,
    } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim()
    ) {
      return res.status(400).json({
        message:
          "Item title is required",
      });
    }

    const list =
      await getAccessibleList(
        listId,
        req.user._id
      );

    if (!list) {
      return res.status(404).json({
        message: "List not found",
      });
    }

    if (
      recurrence?.frequency &&
      !dueDate
    ) {
      return res.status(400).json({
        message:
          "A recurring item needs a due date",
      });
    }

    if (
      !validateAssignee(
        list,
        assignedTo
      )
    ) {
      return res.status(400).json({
        message:
          "That user does not have access to this list",
      });
    }

    const dueDateKey =
      getDateKeyFromValue(dueDate);

    const item = await Item.create({
      listId,

      title: title.trim(),

      dueDate:
        dueDate || null,

      dueDateKey,

      assignedTo:
        assignedTo || null,

      recurrence:
        recurrence || null,

      createdBy:
        req.user._id,
    });

    await item.populate(
      "assignedTo",
      "name email"
    );

    await item.populate(
      "createdBy",
      "name email"
    );

    // Notify another user if the new
    // item has been assigned to them.
    if (
      assignedTo &&
      assignedTo.toString() !==
        req.user._id.toString()
    ) {
      await sendAssignmentNotification({
        assignedUserId:
          assignedTo,

        assignedByName:
          req.user.name,

        itemTitle:
          item.title,

        listName:
          list.name,

        listId:
          list._id,
      });
    }

    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

// --------------------------------------------------
// UPDATE ITEM
// --------------------------------------------------

const updateItem = async (
  req,
  res
) => {
  try {
    const item =
      await Item.findById(
        req.params.id
      );

    if (!item) {
      return res.status(404).json({
        message: "Item not found",
      });
    }

    const previousAssignedTo =
      item.assignedTo
        ? item.assignedTo.toString()
        : null;

    const list =
      await getAccessibleList(
        item.listId,
        req.user._id
      );

    if (!list) {
      return res.status(404).json({
        message: "Item not found",
      });
    }

    const updateData = {};

    // -------------------------------
    // TITLE
    // -------------------------------

    if (
      req.body.title !== undefined
    ) {
      if (
        typeof req.body.title !==
          "string" ||
        !req.body.title.trim()
      ) {
        return res.status(400).json({
          message:
            "Item title cannot be empty",
        });
      }

      updateData.title =
        req.body.title.trim();
    }

    // -------------------------------
    // DUE DATE
    // -------------------------------

    if (
      req.body.dueDate !== undefined
    ) {
      updateData.dueDate =
        req.body.dueDate || null;

      updateData.dueDateKey =
        getDateKeyFromValue(
          req.body.dueDate
        );
    }

    // -------------------------------
    // ASSIGNMENT
    // -------------------------------

    if (
      req.body.assignedTo !==
      undefined
    ) {
      if (
        !validateAssignee(
          list,
          req.body.assignedTo
        )
      ) {
        return res.status(400).json({
          message:
            "That user does not have access to this list",
        });
      }

      updateData.assignedTo =
        req.body.assignedTo || null;
    }

    // -------------------------------
    // RECURRENCE
    // -------------------------------

    if (
      req.body.recurrence !==
      undefined
    ) {
      updateData.recurrence =
        req.body.recurrence || null;
    }

    const effectiveDueDate =
      updateData.dueDate !== undefined
        ? updateData.dueDate
        : item.dueDate;

    const effectiveDueDateKey =
      updateData.dueDateKey !== undefined
        ? updateData.dueDateKey
        : item.dueDateKey ||
          getDateKeyFromValue(
            item.dueDate
          );

    const effectiveRecurrence =
      updateData.recurrence !== undefined
        ? updateData.recurrence
        : item.recurrence;

    if (
      effectiveRecurrence?.frequency &&
      !effectiveDueDate
    ) {
      return res.status(400).json({
        message:
          "A recurring item needs a due date",
      });
    }

    // If a completed recurring item is edited
    // before its next copy has been created,
    // recalculate its next calendar occurrence.
    if (
      item.completed &&
      !item.nextOccurrenceCreated &&
      (
        req.body.dueDate !== undefined ||
        req.body.recurrence !== undefined
      )
    ) {
      const nextOccurrence =
        calculateNextOccurrence(
          effectiveDueDate,
          effectiveDueDateKey,
          effectiveRecurrence
        );

      updateData.nextOccurrenceDate =
        nextOccurrence?.date || null;

      updateData.nextOccurrenceDateKey =
        nextOccurrence?.dateKey || null;

      updateData.nextOccurrenceCreated =
        false;
    }

    // -------------------------------
    // MARK COMPLETE
    // -------------------------------

    if (
      req.body.completed === true
    ) {
      const nextOccurrence =
        calculateNextOccurrence(
          effectiveDueDate,
          effectiveDueDateKey,
          effectiveRecurrence
        );

      updateData.completed = true;

      updateData.completedAt =
        new Date();

      updateData.completedBy =
        req.user._id;

      updateData.nextOccurrenceDate =
        nextOccurrence?.date || null;

      updateData.nextOccurrenceDateKey =
        nextOccurrence?.dateKey || null;

      updateData.nextOccurrenceCreated =
        false;
    }

    // -------------------------------
    // MARK INCOMPLETE
    // -------------------------------

    if (
      req.body.completed === false
    ) {
      if (
        item.nextOccurrenceCreated
      ) {
        return res.status(400).json({
          message:
            "The next recurring occurrence has already been created",
        });
      }

      updateData.completed = false;
      updateData.completedAt = null;
      updateData.completedBy = null;
      updateData.nextOccurrenceDate =
        null;
      updateData.nextOccurrenceDateKey =
        null;
      updateData.nextOccurrenceCreated =
        false;
    }

    const updatedItem =
      await Item.findByIdAndUpdate(
        req.params.id,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      );

    await updatedItem.populate(
      "assignedTo",
      "name email"
    );

    await updatedItem.populate(
      "completedBy",
      "name email"
    );

    await updatedItem.populate(
      "createdBy",
      "name email"
    );

    // -------------------------------
    // ASSIGNMENT NOTIFICATION
    // -------------------------------

    if (
      req.body.assignedTo !==
      undefined
    ) {
      const newAssignedTo =
        req.body.assignedTo
          ? req.body.assignedTo.toString()
          : null;

      const assignmentChanged =
        newAssignedTo !==
        previousAssignedTo;

      const assignedToAnotherUser =
        newAssignedTo &&
        newAssignedTo !==
          req.user._id.toString();

      if (
        assignmentChanged &&
        assignedToAnotherUser
      ) {
        await sendAssignmentNotification({
          assignedUserId:
            newAssignedTo,

          assignedByName:
            req.user.name,

          itemTitle:
            updatedItem.title,

          listName:
            list.name,

          listId:
            list._id,
        });
      }
    }

    res.json(updatedItem);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

// --------------------------------------------------
// DELETE ITEM
// --------------------------------------------------

const deleteItem = async (
  req,
  res
) => {
  try {
    const item =
      await Item.findById(
        req.params.id
      );

    if (!item) {
      return res.status(404).json({
        message: "Item not found",
      });
    }

    const list =
      await getAccessibleList(
        item.listId,
        req.user._id
      );

    if (!list) {
      return res.status(404).json({
        message: "Item not found",
      });
    }

    await Item.findByIdAndDelete(
      req.params.id
    );

    res.json({
      message: "Item deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// --------------------------------------------------
// TODAY / UPCOMING ITEMS
// --------------------------------------------------

const getOverviewItems = async (
  req,
  res
) => {
  try {
    const accessibleLists =
      await List.find({
        $or: [
          { owner: req.user._id },
          { members: req.user._id },
        ],
      }).select("_id");

    const listIds =
      accessibleLists.map(
        (list) => list._id
      );

    for (const listId of listIds) {
      await generateDueRecurringItems(
        listId
      );
    }

    const items = await Item.find({
      listId: {
        $in: listIds,
      },

      completed: false,

      dueDate: {
        $ne: null,
      },
    })
      .populate(
        "assignedTo",
        "name email"
      )
      .populate(
        "listId",
        "name"
      )
      .sort({
        dueDate: 1,
        createdAt: 1,
      });

    res.json(items);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// --------------------------------------------------
// EXPORTS
// --------------------------------------------------

module.exports = {
  getItemsForList,
  getOverviewItems,
  createItem,
  updateItem,
  deleteItem,
};
