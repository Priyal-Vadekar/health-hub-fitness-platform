const express = require("express");
const router = express.Router();
const {
    getExercises,
    getExerciseById,
    createExercise,
    updateExercise,
    deleteExercise
} = require("../controllers/exerciseController");

router.get("/", getExercises);
router.get("/:id", getExerciseById);
router.post("/new-exercise", createExercise);
router.put("/update-exercise/:id", updateExercise);
router.delete("/delete-exercise/:id", deleteExercise);

module.exports = router;