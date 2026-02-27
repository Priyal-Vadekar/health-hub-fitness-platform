// backend/routes/trainerRoutes.js
const express = require("express");
const {
  getAssignedMembers,
  getMemberProgress,
} = require("../controllers/trainerController");
const { authenticateUser } = require("../middleware/authMiddleware");
const { isTrainer } = require("../middleware/dietitianMiddleware");

const router = express.Router();

// All routes require Trainer authentication
router.use(authenticateUser);
router.use(isTrainer);

// Trainer routes
router.get("/assigned-members", getAssignedMembers);
router.get("/member/:memberId/progress", getMemberProgress);

module.exports = router;



