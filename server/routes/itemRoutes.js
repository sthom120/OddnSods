const express = require("express");

const {
  getItemsForList,
  getOverviewItems,
  createItem,
  updateItem,
  deleteItem,
} = require("../controllers/itemController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/overview", getOverviewItems);

router.get(
  "/list/:listId",
  getItemsForList
);

router.post("/", createItem);

router.patch("/:id", updateItem);

router.delete("/:id", deleteItem);

module.exports = router;