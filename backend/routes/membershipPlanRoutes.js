const express = require("express");
const router = express.Router();
const {
    getAllPlans,
    getPlanById,
    createPlan,
    updatePlan,
    deletePlan
} = require("../controllers/membershipPlanController");
const { authenticateUser, isAdmin } = require("../middleware/authMiddleware");

// Public: View membership plans
router.get("/", getAllPlans);

// Admin Only: CRUD operations
router.post("/new-membership-plan", createPlan);
router.put("/update-membership-plan/:id", updatePlan);
router.delete("/delete-membership-plan/:id", deletePlan);

// This must come last to avoid conflicts with custom paths
router.get("/:id", getPlanById);

module.exports = router;
