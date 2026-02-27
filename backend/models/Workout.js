// backend\models\Workout.js
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
    type: mongoose.Schema.Types.Mixed, // Supports both numbers and "Hold for X seconds"
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
});

// Define Workout Schema
const WorkoutSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please provide a title"]
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

module.exports = { Workout, Exercise };