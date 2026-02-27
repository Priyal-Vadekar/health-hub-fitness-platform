// backend/seeders/testimonialSeeder.js
require("dotenv").config({ path: "../../.env" });
const mongoose = require("mongoose");
const fs = require("fs");
const connectDB = require("../config/db"); // Central DB connection setup

const User = require("../models/User");
const Testimonial = require("../models/Testimonial");

const seedTestimonials = async () => {
  try {
    await connectDB(); // Connect to DB

    const data = JSON.parse(fs.readFileSync("./data/testimonials.json", "utf-8"));

    for (const item of data) {
      const user = await User.findOne({ name: item.name });
      if (user) {
        await Testimonial.create({
          user: user._id,
          message: item.message,
          active: true,
          date: new Date(),
        });
        console.log(`Added testimonial for: ${item.name}`);
      } else {
        console.warn(`User not found: ${item.name}`);
      }
    }

    console.log("Testimonials seeding completed.");
    process.exit();
  } catch (err) {
    console.error("Seeding Error:", err);
    process.exit(1);
  }
};

seedTestimonials();
