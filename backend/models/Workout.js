// backend/models/Workout.js
const mongoose = require("mongoose");

// Define Exercise Schema
const ExerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide name"],
    minlength: 3,
    maxlength: 50,
  },
  image: {
    type: String,
    required: [true, "Please provide an image URL"],
  },
  description: {
    type: String,
    required: [true, "Please provide a description"],
  },
  sets: {
    type: Number,
    required: [true, "Please provide the number of sets"],
    min: 1,
  },
  reps: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, "Please provide reps information"],
  },
  tips: {
    type: String,
    required: [true, "Please provide workout tips"],
  },
  steps: {
    type: [String],
    required: [true, "Please provide workout steps"],
    validate: {
      validator: (steps) => steps.length > 0,
      message: "There must be at least one step",
    },
  },
  videoUrl: {
    type: String,
    required: [true, "Please provide a video URL"],
    match: [
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/,
      "Please provide a valid YouTube URL",
    ],
  },
  // ── NEW: track which trainer created this exercise ────────────────────────
  // Optional so existing exercises without this field still work.
  // Populated when a trainer creates an exercise via the Trainer Dashboard.
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Define Workout Schema
const WorkoutSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please provide a title"],
  },
  exercises: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "exercises",
    },
  ],
});

const Exercise = mongoose.model("exercises", ExerciseSchema);
const Workout = mongoose.model("workouts", WorkoutSchema);

module.exports = { Exercise, Workout };