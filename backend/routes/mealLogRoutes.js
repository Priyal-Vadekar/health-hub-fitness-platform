// backend/routes/mealLogRoutes.js
const express = require("express");
const {
  getMealLogs,
  getMealLogByDate,
  addMeal,
  getDietPlanMeals,
  deleteMeal,
  updateMeal,
  getMyMealLogs
} = require("../controllers/mealLogController");
const { authenticateUser } = require("../middleware/authMiddleware");

const router = express.Router();

// All routes require authentication
router.use(authenticateUser);

router.get("/", getMealLogs);
router.get("/my", getMyMealLogs);
router.get("/date/:date", getMealLogByDate);
router.get("/diet-plan-meals", getDietPlanMeals);
router.post("/", addMeal);
router.put("/:mealLogId/meal/:mealId", updateMeal);
router.delete("/:mealLogId/meal/:mealId", deleteMeal);

module.exports = router;



