// backend\routes\assignedDietPlanRoutes.js
const express = require("express");
const {
  getAllAssignedDietPlans,
  getMemberDietPlans,
  assignDietPlan,
  deleteAssignedDietPlan,
  getDietPlanPopularity
} = require("../controllers/assignedDietPlanController");
const { authenticateUser, roleMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

// Admin view all assigned plans
// router.get("/all", authMiddleware, getAllAssignedDietPlans);
router.get("/all", authenticateUser, roleMiddleware(["Admin"]), getAllAssignedDietPlans);

// Member views assigned plans
// router.get("/member", authMiddleware, getMemberDietPlans);
router.get("/member", authenticateUser, roleMiddleware(["Member"]), getMemberDietPlans);

// Trainer assigns diet plan
// router.post("/assign", authMiddleware, assignDietPlan);
router.post("/assign", authenticateUser, roleMiddleware(["Trainer", "RD", "RDN"]), assignDietPlan);

// Trainer/Admin delete assignment
// router.delete("/:id", authMiddleware, deleteAssignedDietPlan);
router.delete("/:id", authenticateUser, roleMiddleware(["Trainer", "Admin"]), deleteAssignedDietPlan);

router.get('/report/popularity', authenticateUser, getDietPlanPopularity);

module.exports = router;
