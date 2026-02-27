// D:\Projects\Main Project\healthhub\backend\config\db.js
const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected");
    } catch (err) {
        console.error("MongoDB connection error:", err);
        process.exit(1); // Exit process on failure
    }
};

module.exports = connectDB;