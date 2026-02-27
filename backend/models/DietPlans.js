// backend\models\DietPlans.js
const mongoose = require("mongoose");

const DietPlanSchema = new mongoose.Schema({
  trainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users", // Assuming "User" is your Trainer model
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  category: {
    type: String,
    required: true,
  },
  meals: [
    {
      timeOfDay: {
        type: String,
        required: true,
      },
      items: [
        { type: String, required: true },
      ],
    },
  ],
});

const DietPlan = mongoose.model("diet_plans", DietPlanSchema);
module.exports = DietPlan;
