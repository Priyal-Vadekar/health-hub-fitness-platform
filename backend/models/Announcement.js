const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  recipients: {
    type: [String], // Array of user IDs or roles
    required: true
  },
  type: {
    type: String, // e.g., 'diet', 'renewal', 'class', etc.
    required: true
  },
  active: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model('Announcement', announcementSchema); 