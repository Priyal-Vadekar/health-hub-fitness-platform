// backend/config/razorpay.js
// Razorpay Test Mode Configuration
require("dotenv").config({ path: "../frontend/.env" });
const Razorpay = require("razorpay");

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn("⚠️  RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not found in environment variables");
}

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

module.exports = razorpayInstance;


