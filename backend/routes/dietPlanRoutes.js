// // backend/routes/dietPlanRoutes.js
// const express = require("express");
// const {
//   createDietPlan,
//   getAllDietPlans,
//   getDietPlanByCategory,
//   getTrainerDietPlans,
//   assignDietPlan,
//   getMemberDietPlans,
//   getDietPlanById,
//   updateDietPlan,
//   deleteDietPlan
// } = require("../controllers/dietPlanController");
// const { authenticateUser, roleMiddleware } = require("../middleware/authMiddleware");

// const router = express.Router();

// // Admin Routes
// router.get("/all-diet-plans", getAllDietPlans);
// router.get("/category/:category", authenticateUser, getDietPlanByCategory);
// // router.get("/category/:category", authenticateUser, roleMiddleware(["Admin"]), getDietPlanByCategory);
// // router.get("/all-diet-plans", authenticateUser, roleMiddleware(["Admin"]), getAllDietPlans);

// // Trainer Routes
// router.post("/create", authenticateUser, createDietPlan);
// router.get("/trainer", authenticateUser, getTrainerDietPlans);
// router.post("/assign", authenticateUser, assignDietPlan);
// // router.post("/create", authenticateUser, roleMiddleware(["Trainer"]), createDietPlan);
// // router.get("/trainer", authenticateUser, roleMiddleware(["Trainer"]), getTrainerDietPlans);
// // router.post("/assign", authenticateUser, roleMiddleware(["Trainer"]), assignDietPlan);

// // Member Routes
// router.get("/member", authenticateUser, getMemberDietPlans);
// // router.get("/member", authenticateUser, roleMiddleware(["Member"]), getMemberDietPlans);

// // General Routes (Diet Plan CRUD operations)
// router.route("/:id")
//   .get(authenticateUser, getDietPlanById)
//   .put(authenticateUser, updateDietPlan)
//   .delete(authenticateUser, deleteDietPlan);

// module.exports = router;

const express = require("express");
const {
  createDietPlan,
  getAllDietPlans,
  getDietPlanByCategory,
  getTrainerDietPlans,
  assignDietPlan,
  getMemberDietPlans,
  getDietPlanById,
  updateDietPlan,
  deleteDietPlan,
  generateSingleDietPlanPDF,
  generateMultipleDietPlansPDF
} = require("../controllers/dietPlanController");
const { authenticateUser } = require("../middleware/authMiddleware");

const router = express.Router();

// Admin Routes
router.get("/all-diet-plans", getAllDietPlans);
router.get("/category/:category", authenticateUser, getDietPlanByCategory);

// Trainer Routes
router.post("/create", authenticateUser, createDietPlan);
router.get("/trainer", authenticateUser, getTrainerDietPlans);
router.post("/assign", authenticateUser, assignDietPlan);

// Member Routes
router.get("/member", authenticateUser, getMemberDietPlans);

// PDF Download Routes
router.get("/:id/download", generateSingleDietPlanPDF);
router.get("/download/multiple", generateMultipleDietPlansPDF);

// General CRUD (keep at bottom so it doesn’t override above)
router
  .route("/:id")
  .get(authenticateUser, getDietPlanById)
  .put(authenticateUser, updateDietPlan)
  .delete(authenticateUser, deleteDietPlan);

module.exports = router;
