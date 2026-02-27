const express = require("express");
const router = express.Router();
const {
    getWorkouts,
    getWorkoutById,
    createWorkout,
    updateWorkout,
    deleteWorkout
} = require("../controllers/workoutController");

router.get("/", getWorkouts);

router.post("/new-workout", createWorkout);
router.put("/update-workout/:id", updateWorkout);
router.delete("/delete-workout/:id", deleteWorkout);

router.get("/:id", getWorkoutById);
module.exports = router;