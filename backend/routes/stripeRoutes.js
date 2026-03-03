// backend/routes/stripeRoutes.js
const express = require("express");
const {
  createCheckoutSession,
  createTrainerCheckoutSession,  // NEW — trainer session payment
  verifyPayment,
  handleWebhook,
} = require("../controllers/stripeController");
const { authenticateUser } = require("../middleware/authMiddleware");

const router = express.Router();

// Membership payment
router.post("/create-checkout-session", authenticateUser, createCheckoutSession);

// Trainer session payment (NEW)
router.post("/create-trainer-session", authenticateUser, createTrainerCheckoutSession);

// Verify payment after redirect (public — called by frontend after Stripe redirect)
router.get("/verify-payment/:sessionId", verifyPayment);

// Webhook (raw body handled at server.js level)
router.post("/webhook", handleWebhook);

module.exports = router;