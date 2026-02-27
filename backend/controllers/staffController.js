const User = require("../models/User");
const Staff = require("../models/Staff");

// Create a new staff member
exports.createStaff = async (req, res) => {
  try {
    const { userId, role, description, specialty } = req.body;
    // Construct the image path relative to frontend/public/Images
    const image = req.file ? `staffImages/${req.file.filename}` : undefined;

    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    // If role is Trainer, specialty is required
    if (role === "Trainer" && !specialty) {
      return res.status(400).json({
        success: false,
        message: "Specialty is required for Trainers",
      });
    }

    // Check if image is required and provided
    if (!image) {
      return res
        .status(400)
        .json({ success: false, message: "Staff image is required" });
    }

    // Create new staff entry
    const newStaff = new Staff({
      user: userId,
      role,
      image,
      description,
      specialty,
      isCertified: false,
    });
    await newStaff.save();

    res.status(201).json({ success: true, data: newStaff });
  } catch (error) {
    console.error("Error creating staff member:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create staff member",
      error: error.message,
    });
  }
};

// Get all staff members
exports.getAllStaff = async (req, res) => {
  try {
    const staff = await Staff.find().populate("user", "name email profilePic");
    res.status(200).json({ success: true, data: staff });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch staff members" });
  }
};

// Get a staff member by ID
exports.getStaffById = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id).populate(
      "user",
      "name email profilePic"
    );

    if (!staff) {
      return res
        .status(404)
        .json({ success: false, message: "Staff member not found" });
    }

    res.status(200).json({ success: true, data: staff });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching staff member" });
  }
};

// Update staff member details
exports.updateStaff = async (req, res) => {
  try {
    const { role, image, description, specialty, isCertified } = req.body;

    // Find the staff member by ID
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res
        .status(404)
        .json({ success: false, message: "Staff member not found" });
    }

    // If role is updated to "Trainer", specialty must be provided
    if (role === "Trainer" && !specialty) {
      return res.status(400).json({
        success: false,
        message: "Specialty is required for Trainers",
      });
    }

    // Update only the fields that are provided
    if (role) staff.role = role;
    if (image) staff.image = image;
    if (description) staff.description = description;
    if (typeof isCertified === "boolean") staff.isCertified = isCertified;

    if (role === "Trainer" && specialty) {
      staff.specialty = specialty; // Update specialty if role is Trainer
    } else if (role && role !== "Trainer" && specialty === undefined) {
      // If role changed to non-Trainer and no new specialty, clear it
      staff.specialty = undefined;
    }

    // Also update User model if isCertified is being updated
    if (typeof isCertified === "boolean") {
      await User.findByIdAndUpdate(staff.user, { isCertified });
    }

    // Save the updated staff member
    await staff.save();
    res.status(200).json({ success: true, data: staff });
  } catch (error) {
    console.error("Update error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error updating staff member" });
  }
};

// Delete staff member
exports.deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res
        .status(404)
        .json({ success: false, message: "Staff member not found" });
    }

    await Staff.findByIdAndDelete(req.params.id);
    res
      .status(200)
      .json({ success: true, message: "Staff member deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error deleting staff member" });
  }
};

// Get only trainers
exports.getAllTrainers = async (req, res) => {
  try {
    const trainers = await Staff.find({ role: "Trainer" }).populate(
      "user",
      "name email profilePic"
    );
    res.status(200).json({ success: true, data: trainers });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching trainers" });
  }
};

// Trainer Performance Report
exports.getTrainerPerformance = async (req, res) => {
  try {
    const trainers = await Staff.aggregate([
      { $match: { role: "Trainer" } },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      {
        $lookup: {
          from: "diet_plans",
          localField: "user",
          foreignField: "trainer",
          as: "createdDietPlans",
        },
      },
      {
        $project: {
          user: { $arrayElemAt: ["$userInfo", 0] },
          createdDietPlansCount: { $size: "$createdDietPlans" },
        },
      },
    ]);

    res.json({ success: true, data: trainers });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error generating trainer performance report",
      error: err.message,
    });
  }
};
