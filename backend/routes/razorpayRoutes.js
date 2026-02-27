// backend/routes/razorpayRoutes.js
// Razorpay Payment Routes (Test Mode Only)
const express = require("express");
const {
  createRazorpayOrder,
  handleRazorpayWebhook,
  verifyPayment,
} = require("../controllers/razorpayController");
const { authenticateUser } = require("../middleware/authMiddleware");

const router = express.Router();

// Create Razorpay order (protected route - requires authentication)
router.post("/create-order", authenticateUser, createRazorpayOrder);

// Webhook endpoint (public - called by Razorpay)
// Note: Raw body is handled in server.js for signature verification
router.post("/webhook", handleRazorpayWebhook);

// Optional: Manual payment verification endpoint (protected)
router.post("/verify-payment", authenticateUser, verifyPayment);

module.exports = router;


