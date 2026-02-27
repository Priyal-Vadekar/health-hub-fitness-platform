const { Exercise } = require("../models/Workout");

// Get all exercises
exports.getExercises = async (req, res) => {
  try {
    const exercises = await Exercise.find();
    res.status(200).json({ success: true, data: exercises });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch exercises", error: error.message });
  }
};

// Get a single exercise by ID
exports.getExerciseById = async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) return res.status(404).json({ success: false, message: "Exercise not found" });

    res.status(200).json({ success: true, data: exercise });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching exercise", error: error.message });
  }
};

// Create a new exercise
exports.createExercise = async (req, res) => {
  try {
    const newExercise = new Exercise(req.body);
    await newExercise.save();
    res.status(201).json({ success: true, message: "Exercise created successfully", data: newExercise });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error creating exercise", error: error.message });
  }
};

// Update an exercise
exports.updateExercise = async (req, res) => {
  try {
    const updatedExercise = await Exercise.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updatedExercise) return res.status(404).json({ success: false, message: "Exercise not found" });

    res.status(200).json({ success: true, message: "Exercise updated successfully", data: updatedExercise });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating exercise", error: error.message });
  }
};

// Delete an exercise
exports.deleteExercise = async (req, res) => {
  try {
    const deletedExercise = await Exercise.findByIdAndDelete(req.params.id);
    if (!deletedExercise) return res.status(404).json({ success: false, message: "Exercise not found" });

    res.status(200).json({ success: true, message: "Exercise deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting exercise", error: error.message });
  }
};
