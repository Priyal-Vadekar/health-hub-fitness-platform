// backend\models\AssignedDietPlan.js
const mongoose = require("mongoose");

const AssignedDietPlanSchema = new mongoose.Schema({
  trainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users", // Trainer who assigned the plan
    required: true,
  },
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Member receiving the plan
    required: true,
  },
  dietPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DietPlan", // Reference to a created diet plan
    required: true,
  },
  assignedAt: {
    type: Date,
    default: Date.now,
  },
});

const AssignedDietPlan = mongoose.model("assigned_diet_plans", AssignedDietPlanSchema);
module.exports = AssignedDietPlan;
