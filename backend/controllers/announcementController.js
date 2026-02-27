const Announcement = require('../models/Announcement');
const { sendAnnouncementEmail } = require('../config/emailService');
const User = require('../models/User'); // Assuming User model exists

// HTML Email Template for Announcements
const createAnnouncementEmailTemplate = (title, description, date) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Announcement - Health Hub</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 24px;
                font-weight: 600;
            }
            .content {
                padding: 40px 30px;
            }
            .announcement-title {
                font-size: 22px;
                color: #333;
                margin-bottom: 15px;
                font-weight: 600;
            }
            .announcement-description {
                font-size: 16px;
                color: #666;
                line-height: 1.6;
                margin-bottom: 20px;
            }
            .announcement-date {
                background-color: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                color: #495057;
                font-size: 14px;
                margin-bottom: 30px;
            }
            .footer {
                background-color: #f8f9fa;
                padding: 20px;
                text-align: center;
                color: #666;
                font-size: 14px;
            }
            .logo {
                font-size: 20px;
                font-weight: bold;
                margin-bottom: 10px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🏋️ Health Hub</div>
                <h1>📢 New Announcement</h1>
            </div>
            <div class="content">
                <div class="announcement-title">${title}</div>
                <div class="announcement-description">${description}</div>
                <div class="announcement-date">
                    <strong>Date:</strong> ${new Date(date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                </div>
            </div>
            <div class="footer">
                <p>© 2024 Health Hub. All rights reserved.</p>
                <p>You received this email because you are a member of Health Hub.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// GET announcements (optionally filtered by role/user)
exports.getAnnouncements = async (req, res) => {
  try {
    const { role, userId } = req.query; // Get role and userId from query

    let query = { active: true };

    // Filter by role if provided - recipients is an array, so use $in
    if (role) {
      query.recipients = { $in: [role] };
    }

    // Filter by userId if provided (for specific user announcements)
    if (userId) {
      query.$or = [
        { recipients: userId },
        { recipients: { $in: [role] } } // Also include role-based announcements
      ];
    }

    const announcements = await Announcement.find(query).sort({ date: -1 });
    res.json({ success: true, data: announcements });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// CREATE announcement + send email
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, description, date, recipients, type } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res
        .status(400)
        .json({ error: 'Recipients are required and must be a non-empty array.' });
    }
    if (!type) {
      return res.status(400).json({ error: 'Type is required.' });
    }

    // 1. Save to DB
    const newAnnouncement = new Announcement({
      title,
      description,
      date,
      recipients,
      type
    });
    await newAnnouncement.save();

    // 2. Fetch emails from User model if recipients are roles
    const users = await User.find({ role: { $in: recipients } });
    const emailList = users.map(u => u.email);

    if (emailList.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No users found for the selected roles." });
    }

    // 3. Send Email
    const subject = `📢 New Announcement: ${title}`;
    const message = createAnnouncementEmailTemplate(title, description, date);

    await sendAnnouncementEmail(emailList, subject, message);

    res
      .status(201)
      .json({ success: true, message: "Announcement created and emails sent." });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error or failed to send emails.",
      error: err.message
    });
  }
};

// UPDATE announcement
exports.updateAnnouncement = async (req, res) => {
  const { id } = req.params;
  const { title, date, description, recipients, type, active } = req.body;
  try {
    const updated = await Announcement.findByIdAndUpdate(
      id,
      { title, date, description, recipients, type, active },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE announcement
exports.deleteAnnouncement = async (req, res) => {
  const { id } = req.params;
  try {
    await Announcement.findByIdAndDelete(id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// TOGGLE active status
exports.updateStatus = async (req, res) => {
  const { id } = req.params;
  try {
    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    announcement.active = !announcement.active;
    await announcement.save();
    res.json({ message: 'Announcement status updated', announcement });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
