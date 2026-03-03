// backend/controllers/exerciseController.js
const { Exercise } = require("../models/Workout");

// Get all exercises (public — no auth needed, used by workout page too)
exports.getExercises = async (req, res) => {
  try {
    // Populate createdBy so frontend can compare ownership
    const exercises = await Exercise.find().populate("createdBy", "name email");
    res.status(200).json({ success: true, data: exercises });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch exercises", error: error.message });
  }
};

// Get a single exercise by ID
exports.getExerciseById = async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id).populate("createdBy", "name email");
    if (!exercise) return res.status(404).json({ success: false, message: "Exercise not found" });
    res.status(200).json({ success: true, data: exercise });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching exercise", error: error.message });
  }
};

// Create a new exercise
// ── FIX: store createdBy from authenticated user (if req.user is present) ──
// The exercise routes are public (no auth middleware), but when called from the
// Trainer Dashboard the http instance sends the Bearer token automatically, so
// req.user is decoded by the JWT. We store it if present; fall back to null.
exports.createExercise = async (req, res) => {
  try {
    const exerciseData = {
      ...req.body,
      createdBy: req.user?.id || null,
    };
    const newExercise = new Exercise(exerciseData);
    await newExercise.save();
    await newExercise.populate("createdBy", "name email");
    res.status(201).json({ success: true, message: "Exercise created successfully", data: newExercise });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error creating exercise", error: error.message });
  }
};

// Update an exercise
// ── Ownership check: only the trainer who created it (or admin) can update ──
exports.updateExercise = async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) return res.status(404).json({ success: false, message: "Exercise not found" });

    // If exercise has an owner, only they can edit it
    if (exercise.createdBy && req.user?.id) {
      if (exercise.createdBy.toString() !== req.user.id && req.user.role !== "Admin") {
        return res.status(403).json({ success: false, message: "Not authorized to edit this exercise" });
      }
    }

    const updatedExercise = await Exercise.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate("createdBy", "name email");

    res.status(200).json({ success: true, message: "Exercise updated successfully", data: updatedExercise });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating exercise", error: error.message });
  }
};

// Delete an exercise
// ── Ownership check: only the trainer who created it (or admin) can delete ──
exports.deleteExercise = async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) return res.status(404).json({ success: false, message: "Exercise not found" });

    if (exercise.createdBy && req.user?.id) {
      if (exercise.createdBy.toString() !== req.user.id && req.user.role !== "Admin") {
        return res.status(403).json({ success: false, message: "Not authorized to delete this exercise" });
      }
    }

    await Exercise.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Exercise deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting exercise", error: error.message });
  }
};