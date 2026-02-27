const mongoose = require('mongoose');
require("dotenv").config({ path: "../../frontend/.env" });

const MembershipPlan = require('../models/MembershipPlan');
const plansData = require('./data/membershipPlans.json'); // Import JSON data

const connectDB = require('../config/db'); // Database connection

const seedMembershipPlans = async () => {
    try {
        await connectDB(); // Connect to MongoDB
        await MembershipPlan.deleteMany(); // Clear existing records

        // Insert membership plans
        await MembershipPlan.insertMany(plansData);
        console.log("Membership plans seeded successfully!");
        
        mongoose.connection.close(); // Close DB connection
    } catch (error) {
        console.error("Seeding failed:", error);
        mongoose.connection.close();
    }
};

seedMembershipPlans();