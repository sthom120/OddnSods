const Item = require("../models/Item");
const List = require("../models/List");
const User = require("../models/User");

const formatListForViewer = (
  list,
  viewerId
) => {
  const plainList = list.toObject();

  const ownerId =
    plainList.owner?._id?.toString?.() ||
    plainList.owner?.toString?.();

  const viewerIsOwner =
    ownerId === viewerId.toString();

  if (!viewerIsOwner) {
    if (
      plainList.owner &&
      typeof plainList.owner === "object"
    ) {
      delete plainList.owner.email;
    }

    if (Array.isArray(plainList.members)) {
      plainList.members =
        plainList.members.map(
          (member) => {
            const cleanMember = {
              ...member,
            };

            delete cleanMember.email;

            return cleanMember;
          }
        );
    }
  }

  return plainList;
};

const getLists = async (req, res) => {
  try {
    const lists = await List.find({
      $or: [
        { owner: req.user._id },
        { members: req.user._id },
      ],
    })
      .populate("owner", "name email")
      .populate("members", "name email")
      .sort({ createdAt: -1 });

    res.json(
      lists.map((list) =>
        formatListForViewer(
          list,
          req.user._id
        )
      )
    );
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getListById = async (req, res) => {
  try {
    const list = await List.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user._id },
        { members: req.user._id },
      ],
    })
      .populate("owner", "name email")
      .populate("members", "name email");

    if (!list) {
      return res.status(404).json({
        message: "List not found",
      });
    }

    res.json(
      formatListForViewer(
        list,
        req.user._id
      )
    );
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const createList = async (req, res) => {
  try {
    const { name, settings } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim()
    ) {
      return res.status(400).json({
        message: "List name is required",
      });
    }

    const list = await List.create({
      name: name.trim(),
      settings,
      owner: req.user._id,
      members: [],
    });

    res.status(201).json(list);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

const updateList = async (req, res) => {
  try {
    const updateData = {};

    if (req.body.name !== undefined) {
      if (
        typeof req.body.name !== "string" ||
        !req.body.name.trim()
      ) {
        return res.status(400).json({
          message: "List name cannot be empty",
        });
      }

      updateData.name = req.body.name.trim();
    }

    if (req.body.settings !== undefined) {
      if (
        !req.body.settings ||
        typeof req.body.settings !== "object" ||
        Array.isArray(req.body.settings)
      ) {
        return res.status(400).json({
          message: "Invalid list settings",
        });
      }

      const allowedSettings = [
        "dueDatesEnabled",
        "assignmentEnabled",
        "showCompleted",
      ];

      for (const settingName of allowedSettings) {
        if (
          req.body.settings[settingName] !== undefined
        ) {
          if (
            typeof req.body.settings[settingName] !==
            "boolean"
          ) {
            return res.status(400).json({
              message: `${settingName} must be true or false`,
            });
          }

          updateData[`settings.${settingName}`] =
            req.body.settings[settingName];
        }
      }
    }

    const list = await List.findOneAndUpdate(
      {
        _id: req.params.id,
        owner: req.user._id,
      },
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("owner", "name email")
      .populate("members", "name email");

    if (!list) {
      return res.status(404).json({
        message: "List not found",
      });
    }

    res.json(
      formatListForViewer(
        list,
        req.user._id
      )
    );
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

const deleteList = async (req, res) => {
  try {
    const list = await List.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!list) {
      return res.status(404).json({
        message: "List not found",
      });
    }

    await Item.deleteMany({
      listId: req.params.id,
    });

    res.json({
      message: "List and its items deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const shareList = async (req, res) => {
  try {
    const { email } = req.body;

    if (
      typeof email !== "string" ||
      !email.trim()
    ) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const list = await List.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!list) {
      return res.status(404).json({
        message: "List not found",
      });
    }

    const userToAdd = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!userToAdd) {
      return res.status(404).json({
        message: "No user found with that email",
      });
    }

    if (userToAdd._id.equals(req.user._id)) {
      return res.status(400).json({
        message: "You already own this list",
      });
    }

    const alreadyMember = list.members.some((memberId) =>
      memberId.equals(userToAdd._id)
    );

    if (alreadyMember) {
      return res.status(400).json({
        message: "That user already has access",
      });
    }

    list.members.push(userToAdd._id);
    await list.save();

    await list.populate("owner", "name email");
    await list.populate("members", "name email");

    res.json(
      formatListForViewer(
        list,
        req.user._id
      )
    );
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

const removeMember = async (req, res) => {
  try {
    const list = await List.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!list) {
      return res.status(404).json({
        message: "List not found",
      });
    }

    list.members = list.members.filter(
      (memberId) =>
        memberId.toString() !== req.params.userId
    );

    await list.save();

    await Item.updateMany(
      {
        listId: list._id,
        assignedTo: req.params.userId,
        completed: false,
      },
      {
        $set: {
          assignedTo: null,
        },
      }
    );

    await list.populate("owner", "name email");
    await list.populate("members", "name email");

    res.json(
      formatListForViewer(
        list,
        req.user._id
      )
    );
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

module.exports = {
  getLists,
  getListById,
  createList,
  updateList,
  deleteList,
  shareList,
  removeMember,
};
