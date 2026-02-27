// backend/models/DietPlanRequest.js
const mongoose = require("mongoose");

const DietPlanRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true
  },
  weight: {
    type: Number,
    required: true
  },
  height: {
    type: Number,
    required: true
  },
  goal: {
    type: String,
    enum: ["loss", "gain", "maintain"],
    required: true
  },
  dietType: {
    type: String,
    enum: ["veg", "nonveg"],
    required: true
  },
  allergies: {
    type: String,
    default: ""
  },
  foodDislikes: {
    type: String,
    default: ""
  },
  medicalNotes: {
    type: String,
    default: ""
  },
  status: {
    type: String,
    enum: ["pending", "assigned", "completed"],
    default: "pending"
  },
  assignedDietitian: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    default: null
  },
  assignedDietPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DietPlan",
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

DietPlanRequestSchema.pre("save", function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("DietPlanRequest", DietPlanRequestSchema);





