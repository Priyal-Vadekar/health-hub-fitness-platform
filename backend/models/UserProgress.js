// backend/models/UserProgress.js
const mongoose = require("mongoose");

const UserProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  weight: {
    type: Number, // in kg
    default: null
  },
  bodyFatPercentage: {
    type: Number,
    default: null
  },
  bmi: {
    type: Number,
    default: null
  },
  waterIntake: {
    type: Number, // in liters
    default: 0
  },
  workoutAdherence: {
    type: Number, // percentage (0-100)
    default: 0
  },
  notes: {
    type: String,
    default: ""
  },
  measurements: {
    chest: { type: Number, default: null },
    waist: { type: Number, default: null },
    hips: { type: Number, default: null },
    arms: { type: Number, default: null },
    thighs: { type: Number, default: null }
  }
}, {
  timestamps: true
});

// Calculate BMI if weight and height are provided
UserProgressSchema.pre("save", function(next) {
  // Note: Height should be stored in user profile or passed separately
  // This is a placeholder - you may want to fetch height from user model
  if (this.weight && !this.bmi) {
    // BMI calculation would require height from user profile
    // For now, we'll leave it to be calculated in the controller
  }
  next();
});

module.exports = mongoose.model("user_progress", UserProgressSchema);


