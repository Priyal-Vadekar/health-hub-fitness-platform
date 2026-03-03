// backend/controllers/staffController.js
const User = require("../models/User");
const Staff = require("../models/Staff");

exports.createStaff = async (req, res) => {
  try {
    const { userId, role, description, specialty } = req.body;
    const image = req.file ? `staffImages/${req.file.filename}` : undefined;
    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ success: false, message: "User not found" });
    if (role === "Trainer" && !specialty) return res.status(400).json({ success: false, message: "Specialty is required for Trainers" });
    if (!image) return res.status(400).json({ success: false, message: "Staff image is required" });
    const newStaff = new Staff({ user: userId, role, image, description, specialty, isCertified: false });
    await newStaff.save();
    res.status(201).json({ success: true, data: newStaff });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create staff member", error: error.message });
  }
};

exports.getAllStaff = async (req, res) => {
  try {
    const staff = await Staff.find().populate("user", "name email profilePic");
    res.status(200).json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch staff members" });
  }
};

exports.getStaffById = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id).populate("user", "name email profilePic");
    if (!staff) return res.status(404).json({ success: false, message: "Staff member not found" });
    res.status(200).json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching staff member" });
  }
};

exports.updateStaff = async (req, res) => {
  try {
    const { role, image, description, specialty, isCertified } = req.body;
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ success: false, message: "Staff member not found" });
    if (role === "Trainer" && !specialty) return res.status(400).json({ success: false, message: "Specialty is required for Trainers" });
    if (role) staff.role = role;
    if (image) staff.image = image;
    if (description) staff.description = description;
    if (typeof isCertified === "boolean") staff.isCertified = isCertified;
    if (role === "Trainer" && specialty) staff.specialty = specialty;
    else if (role && role !== "Trainer" && specialty === undefined) staff.specialty = undefined;
    if (typeof isCertified === "boolean") await User.findByIdAndUpdate(staff.user, { isCertified });
    await staff.save();
    res.status(200).json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating staff member" });
  }
};

exports.deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ success: false, message: "Staff member not found" });
    await Staff.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Staff member deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting staff member" });
  }
};

exports.getAllTrainers = async (req, res) => {
  try {
    const trainers = await Staff.find({ role: "Trainer" }).populate("user", "name email profilePic");
    res.status(200).json({ success: true, data: trainers });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching trainers" });
  }
};

// ── BUG FIX 02: Trainer Performance Report
// Old: counted diet plans created by trainer (always 0 in this system)
//      also missing specialty field in $project
// New: counts Members with assignedTrainer = this trainer's userId
//      includes specialty from Staff document
exports.getTrainerPerformance = async (req, res) => {
  try {
    const trainers = await Staff.aggregate([
      { $match: { role: "Trainer" } },
      {
        // Get trainer's user info (name, email)
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      {
        // Count Members who have this trainer assigned
        $lookup: {
          from: "users",
          let: { trainerId: "$user" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$assignedTrainer", "$$trainerId"] },
                    { $eq: ["$role", "Member"] }
                  ]
                }
              }
            },
            { $count: "count" }
          ],
          as: "assignedMembersData",
        },
      },
      {
        $project: {
          user: { $arrayElemAt: ["$userInfo", 0] },
          specialty: 1,                               // ← FIX: was missing
          assignedMembersCount: {                     // ← FIX: replaces createdDietPlansCount
            $ifNull: [{ $arrayElemAt: ["$assignedMembersData.count", 0] }, 0]
          },
        },
      },
      { $sort: { assignedMembersCount: -1 } }
    ]);

    res.json({ success: true, data: trainers });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error generating trainer performance report", error: err.message });
  }
};