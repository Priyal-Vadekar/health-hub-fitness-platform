const mongoose = require('mongoose');
const User = require('../models/User');

// Helper: get a random date in the past year
function randomDateInPastYear() {
  const now = new Date();
  const pastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  return new Date(pastYear.getTime() + Math.random() * (now.getTime() - pastYear.getTime()));
}

async function updateCreatedAtRandom() {
  // Replace with your actual MongoDB connection string
  await mongoose.connect('mongodb://localhost:27017/healthhub', { useNewUrlParser: true, useUnifiedTopology: true });

  const users = await User.find({});
  let updated = 0;
  for (const user of users) {
    const date = randomDateInPastYear();
    user.createdAt = date;
    user.updatedAt = date;
    await user.save();
    updated++;
  }
  console.log('Users updated:', updated);
  mongoose.disconnect();
}

updateCreatedAtRandom();
