const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Staff = require("../models/Staff");
require('dotenv').config({ path: path.resolve(__dirname, '../../frontend/.env') });

// Read JSON file
const staffDataPath = path.join(__dirname, "./data/staff.json");
const staffData = JSON.parse(fs.readFileSync(staffDataPath, "utf-8"));

// MongoDB Connection
const seedStaff = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB...");

    await Staff.deleteMany(); // Clear existing staff data
    console.log("Old staff data removed.");

    await Staff.insertMany(staffData);
    console.log("New staff data seeded successfully!");

    mongoose.connection.close();
  } catch (error) {
    console.error("Seeding error:", error);
    mongoose.connection.close();
  }
};

seedStaff();
