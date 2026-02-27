// controllers/userController.js
const User = require("../models/User");
const Staff = require("../models/Staff");
const Payment = require("../models/Payment");

// GET all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};

// GET all dietitians (RD/RDN) with assigned member counts
exports.getDietitians = async (req, res) => {
  try {
    const dietitians = await User.find({ role: { $in: ["RD", "RDN"] } })
      .select("name email role isCertified specialization isEmailVerified")
      .lean();

    const memberCounts = await User.aggregate([
      { $match: { role: "Member", assignedDietitian: { $ne: null } } },
      { $group: { _id: "$assignedDietitian", count: { $sum: 1 } } }
    ]);

    const countMap = memberCounts.reduce((map, item) => {
      if (item._id) {
        map[item._id.toString()] = item.count;
      }
      return map;
    }, {});

    const enriched = dietitians.map((dietitian) => ({
      ...dietitian,
      assignedMembersCount: countMap[dietitian._id.toString()] || 0,
      status: dietitian.isEmailVerified ? "Active" : "Inactive"
    }));

    res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch dietitians",
      error: error.message
    });
  }
};

// GET a single user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch user" });
  }
};

// CREATE a new user
exports.createUser = async (req, res) => {
  try {
    const newUser = new User(req.body);
    await newUser.save();
    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to create user",
      error: error.message
    });
  }
};

// UPDATE user role (Only admin can update role)
exports.updateUserRole = async (req, res) => {
  try {
    const { role, specialization, isCertified } = req.body;

    if (!role)
      return res
        .status(400)
        .json({ success: false, message: "Role is required" });

    const updateData = { role };
    if (specialization !== undefined) updateData.specialization = specialization;
    if (typeof isCertified === "boolean") updateData.isCertified = isCertified;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updatedUser)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // Also update Staff model if user is a trainer/dietitian
    if (
      (updatedUser.role === "Trainer" ||
        updatedUser.role === "RD" ||
        updatedUser.role === "RDN") &&
      typeof isCertified === "boolean"
    ) {
      await Staff.updateOne(
        { user: req.params.id },
        { isCertified },
        { upsert: true }
      );
    }

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to update role",
      error: error.message
    });
  }
};

// Assign Dietitian to Member
exports.assignDietitian = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { dietitianId } = req.body;

    const member = await User.findById(memberId);
    if (!member || member.role !== "Member") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid member" });
    }

    if (dietitianId) {
      const dietitian = await User.findById(dietitianId);
      if (!dietitian || (dietitian.role !== "RD" && dietitian.role !== "RDN")) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid dietitian" });
      }
      member.assignedDietitian = dietitianId;
    } else {
      member.assignedDietitian = null;
    }

    await member.save();

    res.status(200).json({ success: true, data: member });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to assign dietitian",
      error: error.message
    });
  }
};

// Assign Trainer to Member
exports.assignTrainer = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { trainerId } = req.body;

    const member = await User.findById(memberId);
    if (!member || member.role !== "Member") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid member" });
    }

    if (trainerId) {
      const trainer = await User.findById(trainerId);
      if (!trainer || trainer.role !== "Trainer") {
        return res
          .status(400)
          .json({ success: false, message: "Invalid trainer" });
      }
      member.assignedTrainer = trainerId;
    } else {
      member.assignedTrainer = null;
    }

    await member.save();

    res.status(200).json({ success: true, data: member });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to assign trainer",
      error: error.message
    });
  }
};

// UPDATE user certification status (Only admin can update)
exports.updateCertification = async (req, res) => {
  try {
    const { isCertified } = req.body;
    const userId = req.params.id;

    if (typeof isCertified !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isCertified must be a boolean"
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isCertified },
      { new: true }
    );

    if (!updatedUser)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // Also update Staff model if user is a trainer/dietitian
    if (
      updatedUser.role === "Trainer" ||
      updatedUser.role === "RD" ||
      updatedUser.role === "RDN"
    ) {
      await Staff.updateOne({ user: userId }, { isCertified });
    }

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to update certification",
      error: error.message
    });
  }
};

// DELETE a user
exports.deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to delete user" });
  }
};

// Membership Growth Report: new members per month
exports.getMembershipGrowth = async (req, res) => {
  try {
    const { start, end } = req.query;
    const match = { role: "Member" };
    if (start || end) {
      match.createdAt = {};
      if (start) match.createdAt.$gte = new Date(start);
      if (end) match.createdAt.$lte = new Date(end);
    }

    const growth = await User.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({ success: true, data: growth });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error generating membership growth report",
      error: err.message
    });
  }
};

// Dashboard Counts Report: Get total counts for dashboard
exports.getDashboardCounts = async (req, res) => {
  try {
    const [memberCount, trainerCount, totalSales] = await Promise.all([
      User.countDocuments({ role: "Member" }),
      Staff.countDocuments({ role: "Trainer" }),
      Payment.aggregate([
        { $match: { status: "Completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ])
    ]);

    const salesTotal = totalSales.length > 0 ? totalSales[0].total : 0;

    res.json({
      success: true,
      data: {
        totalMembers: memberCount,
        totalTrainers: trainerCount,
        totalSales: salesTotal
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error generating dashboard counts",
      error: err.message
    });
  }
};

// Dietitian analytics for admin dashboard
exports.getDietitianAnalytics = async (req, res) => {
  try {
    const dietitians = await User.find({ role: { $in: ["RD", "RDN"] } })
      .select("name email role isCertified specialization")
      .lean();

    const memberAssignments = await User.aggregate([
      { $match: { role: "Member", assignedDietitian: { $ne: null } } },
      { $group: { _id: "$assignedDietitian", count: { $sum: 1 } } }
    ]);

    const assignmentMap = memberAssignments.reduce((acc, curr) => {
      if (curr._id) {
        acc[curr._id.toString()] = curr.count;
      }
      return acc;
    }, {});

    const distribution = dietitians.map((dietitian) => ({
      dietitianId: dietitian._id,
      name: dietitian.name,
      specialization: dietitian.specialization || "General",
      isCertified: dietitian.isCertified,
      members: assignmentMap[dietitian._id.toString()] || 0
    }));

    const totalAssignedMembers = distribution.reduce(
      (sum, item) => sum + item.members,
      0
    );
    const averageLoad = distribution.length
      ? Number((totalAssignedMembers / distribution.length).toFixed(1))
      : 0;
    const topDietitians = [...distribution]
      .sort((a, b) => b.members - a.members)
      .slice(0, 5);

    res.status(200).json({
      success: true,
      data: {
        totalDietitians: distribution.length,
        totalAssignedMembers,
        averageLoad,
        distribution,
        topDietitians
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch dietitian analytics",
      error: error.message
    });
  }
};

// Bulk assign members to a trainer (Admin only)
exports.assignTrainerToMembers = async (req, res) => {
  try {
    const { trainerId } = req.params;
    const { memberIds = [] } = req.body;

    if (!Array.isArray(memberIds)) {
      return res.status(400).json({
        success: false,
        message: "memberIds must be an array"
      });
    }

    const trainer = await User.findById(trainerId);
    if (!trainer || trainer.role !== "Trainer") {
      return res
        .status(404)
        .json({ success: false, message: "Trainer not found" });
    }

    await User.updateMany(
      { role: "Member", assignedTrainer: trainerId, _id: { $nin: memberIds } },
      { $set: { assignedTrainer: null } }
    );

    const result = await User.updateMany(
      { _id: { $in: memberIds }, role: "Member" },
      { $set: { assignedTrainer: trainerId } }
    );

    res.status(200).json({
      success: true,
      message: "Trainer assigned to members successfully",
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to assign trainer",
      error: error.message
    });
  }
};

// Bulk assign members to a dietitian (Admin only)
exports.assignDietitianToMembers = async (req, res) => {
  try {
    const { dietitianId } = req.params;
    const { memberIds = [] } = req.body;

    if (!Array.isArray(memberIds)) {
      return res.status(400).json({
        success: false,
        message: "memberIds must be an array"
      });
    }

    const dietitian = await User.findById(dietitianId);
    if (!dietitian || !["RD", "RDN"].includes(dietitian.role)) {
      return res
        .status(404)
        .json({ success: false, message: "Dietitian not found" });
    }

    await User.updateMany(
      { role: "Member", assignedDietitian: dietitianId, _id: { $nin: memberIds } },
      { $set: { assignedDietitian: null } }
    );

    const result = await User.updateMany(
      { _id: { $in: memberIds }, role: "Member" },
      { $set: { assignedDietitian: dietitianId } }
    );

    res.status(200).json({
      success: true,
      message: "Dietitian assignment updated",
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to assign dietitian",
      error: error.message
    });
  }
};
