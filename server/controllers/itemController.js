const Item = require("../models/Item");

const getItemsForList = async (req, res) => {
  try {
    const items = await Item.find({
      listId: req.params.listId,
    }).sort({ createdAt: 1 });

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createItem = async (req, res) => {
  try {
    const {
      listId,
      title,
      dueDate,
      assignedTo,
      recurrence,
    } = req.body;

    const item = await Item.create({
      listId,
      title,
      dueDate: dueDate || null,
      assignedTo: assignedTo || null,
      recurrence: recurrence || null,
    });

    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateItem = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.body.completed === true) {
      updateData.completedAt = new Date();
    }

    if (req.body.completed === false) {
      updateData.completedAt = null;
      updateData.completedBy = null;
    }

    const item = await Item.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteItem = async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json({ message: "Item deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getItemsForList,
  createItem,
  updateItem,
  deleteItem,
};