const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: "../../.env" });
const connectDB = require("../config/db"); // Use centralized DB connection
const { Workout, Exercise } = require("../models/Workout");

const filePath = path.join(__dirname, "./data/workouts.json");
const workoutCategories = JSON.parse(fs.readFileSync(filePath, "utf8"));

const seedWorkouts = async () => {
  try {
    await connectDB(); // Connect to MongoDB
    await Workout.deleteMany();
    await Exercise.deleteMany();
    console.log("Existing workouts and exercises deleted.");

    // Insert exercises first and store their ObjectIds
    const exerciseMap = {};
    for (const category of workoutCategories) {
      for (const exercise of category.exercises) {
        const newExercise = await Exercise.create(exercise);
        exerciseMap[exercise.name] = newExercise._id;
      }
    }
    console.log("Exercises inserted.");

    // Insert workouts with ObjectId references
    for (const category of workoutCategories) {
      const workout = {
        title: category.title,
        exercises: category.exercises.map((exercise) => exerciseMap[exercise.name]),
      };
      await Workout.create(workout);
    }

    console.log("Workout data inserted successfully.");
  } catch (error) {
    console.error("Error seeding workouts:", error);
  } finally {
    mongoose.connection.close();
  }
};

// Run seeding
seedWorkouts();