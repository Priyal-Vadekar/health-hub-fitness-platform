const mongoose = require('mongoose');
const fs = require('fs');
const path = require("path");
require('dotenv').config({ path: path.resolve(__dirname, '../../frontend/.env') });
const connectDB = require('../config/db'); // Use centralized DB connection
const DietPlan = require('../models/DietPlans');


const dietPlanDataPath = path.join(__dirname, "./data/dietPlans.json");
const dietPlans = JSON.parse(fs.readFileSync(dietPlanDataPath, 'utf-8'));

const seedDietPlans = async () => {
  try {
    await connectDB(); // Connect to MongoDB
    await DietPlan.deleteMany(); // Clear existing records
    await DietPlan.insertMany(dietPlans);
    console.log('Diet plans seeded successfully!');
  } catch (error) {
    console.error('Error inserting diet plans:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run seeding
seedDietPlans();