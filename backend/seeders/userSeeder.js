const mongoose = require("mongoose");
const axios = require("axios");
require('dotenv').config({ path: path.resolve(__dirname, '../../frontend/.env') });
const connectDB = require("../config/db"); // Import the database connection
const User = require("../models/User");
const bcrypt = require("bcryptjs");

const fetchUsersFromURL = async () => {
    try {
        const response = await axios.get("https://67cc91d3dd7651e464ec4747.mockapi.io/users"); // Replace with actual API URL
        return response.data; // Expecting an array of user objects
    } catch (error) {
        console.error("Error fetching users:", error.message);
        return [];
    }
};

const seedUsers = async () => {
    try {
        await connectDB(); // Connect to MongoDB

        console.log("Fetching users from API...");
        const users = await fetchUsersFromURL();

        if (users.length === 0) {
            console.log("No user data found. Seeding skipped.");
            return;
        }

        await User.deleteMany(); // Clear existing users
        console.log("Old users removed.");

        // Hash passwords before inserting (if provided)
        const hashedUsers = await Promise.all(
            users.map(async (user) => ({
                ...user,
                password: user.password ? await bcrypt.hash(user.password, 10) : undefined,
            }))
        );

        await User.insertMany(hashedUsers);
        console.log("Users seeded successfully!");

    } catch (error) {
        console.error("Seeding error:", error);
    } finally {
        mongoose.connection.close();
        console.log("Database connection closed.");
    }
};

// Run the seeder
seedUsers();