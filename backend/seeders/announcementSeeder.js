const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../frontend/.env') });
const fs = require('fs');
const Announcement = require('../models/Announcement');
const connectDB = require('../config/db');

// Path to the JSON data file
const dataPath = path.join(__dirname, 'data', 'announcement.json');

async function seed() {
  try {
    await connectDB();
    const announcements = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    await Announcement.deleteMany({});
    await Announcement.insertMany(announcements);
    console.log('Announcements seeded!');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed(); 