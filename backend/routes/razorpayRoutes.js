// backend/routes/razorpayRoutes.js
const express = require("express");
const {
  createRazorpayOrder,
  createTrainerOrder,       // NEW — trainer session payment
  handleRazorpayWebhook,
  verifyPayment,
} = require("../controllers/razorpayController");
const { authenticateUser } = require("../middleware/authMiddleware");

const router = express.Router();

// Membership payment
router.post("/create-order", authenticateUser, createRazorpayOrder);

// Trainer session payment (NEW)
router.post("/create-trainer-order", authenticateUser, createTrainerOrder);

// Webhook (public — called by Razorpay, raw body handled in server.js)
router.post("/webhook", handleRazorpayWebhook);

// Manual verification (optional fallback)
router.post("/verify-payment", authenticateUser, verifyPayment);

module.exports = router;