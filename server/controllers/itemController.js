const Item = require("../models/Item");
const List = require("../models/List");

const {
  sendAssignmentNotification,
} = require("../services/notificationService");

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
  recurrence
) => {
  if (!dueDate || !recurrence?.frequency) {
    return null;
  }

  const nextDate = new Date(dueDate);

  switch (recurrence.frequency) {
    case "daily":
      nextDate.setUTCDate(
        nextDate.getUTCDate() + 1
      );
      break;

    case "weekly":
      nextDate.setUTCDate(
        nextDate.getUTCDate() + 7
      );
      break;

    case "fortnightly":
      nextDate.setUTCDate(
        nextDate.getUTCDate() + 14
      );
      break;

    case "monthly": {
      const originalDay =
        nextDate.getUTCDate();

      nextDate.setUTCDate(1);

      nextDate.setUTCMonth(
        nextDate.getUTCMonth() + 1
      );

      const lastDayOfMonth =
        new Date(
          Date.UTC(
            nextDate.getUTCFullYear(),
            nextDate.getUTCMonth() + 1,
            0
          )
        ).getUTCDate();

      nextDate.setUTCDate(
        Math.min(
          originalDay,
          lastDayOfMonth
        )
      );

      break;
    }

    default:
      return null;
  }

  return nextDate;
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
    const now = new Date();

    const dueRecurringItems =
      await Item.find({
        listId,
        completed: true,

        recurrence: {
          $ne: null,
        },

        nextOccurrenceCreated: false,

        nextOccurrenceDate: {
          $ne: null,
          $lte: now,
        },
      });

    for (const oldItem of dueRecurringItems) {
      const existingNextItem =
        await Item.findOne({
          previousOccurrenceId:
            oldItem._id,
        });

      if (!existingNextItem) {
        await Item.create({
          listId: oldItem.listId,

          title: oldItem.title,

          dueDate:
            oldItem.nextOccurrenceDate,

          assignedTo:
            oldItem.assignedTo,

          recurrence:
            oldItem.recurrence,

          createdBy:
            oldItem.createdBy,

          previousOccurrenceId:
            oldItem._id,
        });
      }

      oldItem.nextOccurrenceCreated =
        true;

      await oldItem.save();
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

    if (!title?.trim()) {
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

    const item = await Item.create({
      listId,

      title: title.trim(),

      dueDate:
        dueDate || null,

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
      void sendAssignmentNotification({
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

    // Store this BEFORE changing the item.
    // We use it to determine whether
    // assignment actually changed.
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
      if (!req.body.title.trim()) {
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

    // If a completed recurring item
    // is edited before its next copy
    // has been created, recalculate
    // the future occurrence date.
    if (
      item.completed &&
      !item.nextOccurrenceCreated &&
      (
        req.body.dueDate !== undefined ||
        req.body.recurrence !== undefined
      )
    ) {
      updateData.nextOccurrenceDate =
        calculateNextOccurrence(
          effectiveDueDate,
          effectiveRecurrence
        );

      updateData.nextOccurrenceCreated =
        false;
    }

    // -------------------------------
    // MARK COMPLETE
    // -------------------------------

    if (
      req.body.completed === true
    ) {
      updateData.completed = true;

      updateData.completedAt =
        new Date();

      updateData.completedBy =
        req.user._id;

      updateData.nextOccurrenceDate =
        calculateNextOccurrence(
          effectiveDueDate,
          effectiveRecurrence
        );

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
        void sendAssignmentNotification({
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