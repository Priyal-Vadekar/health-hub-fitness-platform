// backend/routes/userProgressRoutes.js
const express = require("express");
const {
  getProgress,
  addProgress,
  getProgressSummary,
  deleteProgress
} = require("../controllers/userProgressController");
const { authenticateUser } = require("../middleware/authMiddleware");

const router = express.Router();

// All routes require authentication
router.use(authenticateUser);

// GET all progress entries for logged-in user
router.get("/", getProgress);

// GET summarized progress (e.g., stats/graphs)
router.get("/summary", getProgressSummary);

// ADD a new progress entry
router.post("/", addProgress);

// DELETE a specific progress entry
router.delete("/:progressId", deleteProgress);

module.exports = router;




