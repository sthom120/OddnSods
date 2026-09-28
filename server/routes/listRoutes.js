const express = require("express");

const {
  getLists,
  getListById,
  createList,
  updateList,
  deleteList,
  shareList,
  removeMember,
} = require("../controllers/listController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getLists);
router.post("/", createList);

router.post("/:id/share", shareList);
router.delete("/:id/members/:userId", removeMember);

router.get("/:id", getListById);
router.patch("/:id", updateList);
router.delete("/:id", deleteList);

module.exports = router;