const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: "../../.env" });
const connectDB = require("../config/db"); // Centralized DB connection setup
const UserMembership = require("../models/UserMembership"); // Your UserMembership model

// Connect to the MongoDB database using the centralized DB connection
connectDB();

// Read the JSON data from the file
const filePath = path.join(__dirname, "./data/membershipPlan.json");
const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

// Seeder logic to insert multiple documents into the UserMembership collection
const seedUserMemberships = async () => {
  try {
    // Clear the existing data in the UserMembership collection
    await UserMembership.deleteMany();

    // Insert multiple records from the userMembership.json
    const memberships = await UserMembership.insertMany(data);

    console.log(`Inserted ${memberships.length} memberships into the database.`);
    mongoose.connection.close();
  } catch (err) {
    console.error("Error during seeding process:", err);
    mongoose.connection.close();
  }
};

// Run the seeder
seedUserMemberships();
