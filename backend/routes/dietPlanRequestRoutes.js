// backend/routes/dietPlanRequestRoutes.js
const express = require("express");
const router = express.Router();
const {
  createDietPlanRequest,
  getMyDietPlanRequest,
  getAllRequests,
  assignDietPlanToRequest
} = require("../controllers/dietPlanRequestController");
const { authenticateUser } = require("../middleware/authMiddleware");
const { isDietitian } = require("../middleware/dietitianMiddleware");

// Member routes
router.post("/", authenticateUser, createDietPlanRequest);
router.get("/my", authenticateUser, getMyDietPlanRequest);

// Dietitian/Admin routes
router.get("/all", authenticateUser, getAllRequests);
router.patch("/:requestId/assign", authenticateUser, isDietitian, assignDietPlanToRequest);

module.exports = router;
