const express = require("express");

const {
  getItemsForList,
  createItem,
  updateItem,
  deleteItem,
} = require("../controllers/itemController");

const router = express.Router();

router.get("/list/:listId", getItemsForList);
router.post("/", createItem);
router.patch("/:id", updateItem);
router.delete("/:id", deleteItem);

module.exports = router;