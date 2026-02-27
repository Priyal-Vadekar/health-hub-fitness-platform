// backend/routes/stripeRoutes.js
const express = require("express");
const {
  createCheckoutSession,
  verifyPayment,
  handleWebhook,
} = require("../controllers/stripeController");
const { authenticateUser } = require("../middleware/authMiddleware");

const router = express.Router();

// Create checkout session (protected)
router.post("/create-checkout-session", authenticateUser, createCheckoutSession);

// Verify payment status (public, used by frontend after redirect)
router.get("/verify-payment/:sessionId", verifyPayment);

// Webhook endpoint (raw body handled at server level)
router.post("/webhook", handleWebhook);

module.exports = router;

