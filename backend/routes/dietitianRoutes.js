// backend/routes/dietitianRoutes.js
const express = require("express");
const {
  getAssignedMembers,
  getMemberSummary,
  getMealLogsForReview,
  addMealLogFeedback,
  generateMemberReport
} = require("../controllers/dietitianController");
const {
  getAllDietPlans,
  createDietPlan,
  updateDietPlan,
  deleteDietPlan,
  assignDietPlan
} = require("../controllers/dietPlanController");
const { authenticateUser } = require("../middleware/authMiddleware");
const { isDietitian } = require("../middleware/dietitianMiddleware");

const router = express.Router();

// All routes require Dietitian authentication
router.use(authenticateUser);
router.use(isDietitian);

// Member management
router.get("/assigned-members", getAssignedMembers);
router.get("/member/:memberId/summary", getMemberSummary);
router.get("/meal-logs", getMealLogsForReview);
router.post("/meal-logs/:mealLogId/feedback", addMealLogFeedback);
router.get("/report/:memberId", generateMemberReport);

// Diet plan management - using dietPlanController functions
router.get("/diet-plans", getAllDietPlans);
router.post("/diet-plans", createDietPlan);
router.put("/diet-plans/:id", updateDietPlan);
router.delete("/diet-plans/:id", deleteDietPlan);
router.post("/assign-diet-plan", assignDietPlan);

module.exports = router;
