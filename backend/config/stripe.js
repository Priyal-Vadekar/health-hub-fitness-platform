// backend/config/stripe.js
require("dotenv").config({ path: "../frontend/.env" });
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("⚠️  STRIPE_SECRET_KEY not found in environment variables");
}

module.exports = stripe;

