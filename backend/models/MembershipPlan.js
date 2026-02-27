// backend\models\MembershipPlan.js
const mongoose = require('mongoose');

const MembershipPlanSchema = new mongoose.Schema({
  plan: {
    type: String,
    required: true,
    enum: ['1-month', '3-month', '6-month', '1-year', '2-year', '3-year'],
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    enum: [1, 3, 6, 12, 24, 36], // Store membership duration in months
  },
  price: {
    type: Number,
    required: true,
  },
  personalTrainerAvailable: {
    type: Boolean,
    default: true, // Indicates if a personal trainer option is available
  },
  personalTrainerCharge: {
    type: Number,
    default: 0, // Extra cost for personal trainer
  },
  discount: {
    type: String, // Example: "10% off"
  },
  benefits: {
    type: [String], // List of benefits for the plan
    required: true,
  }
});

module.exports = mongoose.model('membership_plans', MembershipPlanSchema);