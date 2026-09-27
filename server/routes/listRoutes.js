const express = require("express");

const {
  getLists,
  getListById,
  createList,
  updateList,
  deleteList,
} = require("../controllers/listController");

const router = express.Router();

router.get("/", getLists);
router.get("/:id", getListById);
router.post("/", createList);
router.patch("/:id", updateList);
router.delete("/:id", deleteList);

module.exports = router;