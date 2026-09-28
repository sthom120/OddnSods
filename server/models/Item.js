const mongoose = require("mongoose");

const recurrenceSchema = new mongoose.Schema(
  {
    frequency: {
      type: String,
      enum: [
        "daily",
        "weekly",
        "fortnightly",
        "monthly",
      ],
      required: true,
    },
  },
  {
    _id: false,
  }
);

const itemSchema = new mongoose.Schema(
  {
    listId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "List",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    completed: {
      type: Boolean,
      default: false,
    },

    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    dueDate: {
      type: Date,
      default: null,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    recurrence: {
      type: recurrenceSchema,
      default: null,
    },

    nextOccurrenceDate: {
      type: Date,
      default: null,
    },

    nextOccurrenceCreated: {
      type: Boolean,
      default: false,
    },

    previousOccurrenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Item", itemSchema);