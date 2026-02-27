const { Workout, Exercise } = require("../models/Workout");

// Get all workouts with populated exercises
exports.getWorkouts = async (req, res) => {
  try {
    const workouts = await Workout.find().populate("exercises");
    res.status(200).json({ success: true, data: workouts });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch workouts", error: error.message });
  }
};

// Get a single workout by ID
exports.getWorkoutById = async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id).populate("exercises");
    if (!workout) return res.status(404).json({ success: false, message: "Workout not found" });

    res.status(200).json({ success: true, data: workout });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching workout", error: error.message });
  }
};

// Create a new workout
exports.createWorkout = async (req, res) => {
  try {
    const { title, exercises } = req.body;

    // Validate if exercises contain valid ObjectIds
    const validExercises = await Exercise.find({ _id: { $in: exercises } });
    if (validExercises.length !== exercises.length) {
      return res.status(400).json({ success: false, message: "Invalid exercises provided" });
    }

    const newWorkout = new Workout({ title, exercises });
    await newWorkout.save();
    res.status(201).json({ success: true, message: "Workout created successfully", data: newWorkout });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error creating workout", error: error.message });
  }
};

// Update a workout
exports.updateWorkout = async (req, res) => {
  try {
    const { title, exercises } = req.body;

    const updatedWorkout = await Workout.findByIdAndUpdate(
      req.params.id,
      { title, exercises },
      { new: true, runValidators: true }
    ).populate("exercises");

    if (!updatedWorkout) return res.status(404).json({ success: false, message: "Workout not found" });

    res.status(200).json({ success: true, message: "Workout updated successfully", data: updatedWorkout });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating workout", error: error.message });
  }
};

// Delete a workout
exports.deleteWorkout = async (req, res) => {
  try {
    const deletedWorkout = await Workout.findByIdAndDelete(req.params.id);
    if (!deletedWorkout) return res.status(404).json({ success: false, message: "Workout not found" });

    res.status(200).json({ success: true, message: "Workout deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting workout", error: error.message });
  }
};
