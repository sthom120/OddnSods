const Item = require("../models/Item");

const List = require("../models/List");

const getLists = async (req, res) => {
  try {
    const lists = await List.find().sort({ createdAt: -1 });
    res.json(lists);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getListById = async (req, res) => {
  try {
    const list = await List.findById(req.params.id);

    if (!list) {
      return res.status(404).json({ message: "List not found" });
    }

    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createList = async (req, res) => {
  try {
    const { name, settings } = req.body;

    const list = await List.create({
      name,
      settings,
    });

    res.status(201).json(list);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateList = async (req, res) => {
  try {
    const list = await List.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!list) {
      return res.status(404).json({ message: "List not found" });
    }

    res.json(list);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteList = async (req, res) => {
  try {
    const list = await List.findByIdAndDelete(req.params.id);

    if (!list) {
      return res.status(404).json({ message: "List not found" });
    }

    await Item.deleteMany({
      listId: req.params.id,
    });

    res.json({
      message: "List and its items deleted",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getLists,
  getListById,
  createList,
  updateList,
  deleteList,
};