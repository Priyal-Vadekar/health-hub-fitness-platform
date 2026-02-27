// backend/routes/trainerBookingRoutes.js
const express = require("express");
const {
  getTrainerBookings,
  getMemberBookings,
  createBooking,
  confirmBooking,
  cancelBooking,
  getAvailableSlots,
} = require("../controllers/trainerBookingController");
const { authenticateUser } = require("../middleware/authMiddleware");
const { isTrainer } = require("../middleware/dietitianMiddleware");

const router = express.Router();

// All routes require authentication
router.use(authenticateUser);

// Public routes (for members)
router.get("/member", getMemberBookings);
router.get("/available-slots", getAvailableSlots);
router.post("/", createBooking);
router.post("/confirm", confirmBooking);
router.post("/cancel", cancelBooking);

// Trainer-only routes
router.get("/trainer", isTrainer, getTrainerBookings);

module.exports = router;




