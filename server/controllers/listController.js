const Item = require("../models/Item");
const List = require("../models/List");
const User = require("../models/User");

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

    res.json(lists);
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

    res.json(list);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const createList = async (req, res) => {
  try {
    const { name, settings } = req.body;

    const list = await List.create({
      name,
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
    const list = await List.findOneAndUpdate(
      {
        _id: req.params.id,
        owner: req.user._id,
      },
      req.body,
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

    res.json(list);
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
      email: email.toLowerCase(),
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

    res.json(list);
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

    await list.populate("owner", "name email");
    await list.populate("members", "name email");

    res.json(list);
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