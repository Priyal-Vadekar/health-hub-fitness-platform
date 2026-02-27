// backend/controllers/dietPlanController.js
const DietPlan = require("../models/DietPlans");
const AssignedDietPlan = require("../models/AssignedDietPlan");
const User = require("../models/User");

const generatePDF = require("../utils/generatePDF");

// Create Diet Plan (Trainer or Dietitian)
const createDietPlan = async (req, res) => {
  try {
    if (!req.user || !["Trainer", "RD", "RDN"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Access denied. Trainers or Dietitians only." });
    }

    const { category, meals } = req.body;
    if (!category || !Array.isArray(meals) || meals.length === 0) {
      return res
        .status(400)
        .json({ message: "Category and at least one meal are required" });
    }

    const newDietPlan = new DietPlan({
      trainer: req.user.id,
      category,
      meals,
    });
    await newDietPlan.save();
    res.status(201).json({
      success: true,
      message: "Diet Plan created successfully",
      data: newDietPlan,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating diet plan",
      error: error.message,
    });
  }
};

// Get all Diet Plans (for Admin, Trainer, or Dietitian)
const getAllDietPlans = async (req, res) => {
  try {
    const dietPlans = await DietPlan.find().populate(
      "trainer",
      "name email role"
    );
    res.status(200).json({ success: true, data: dietPlans });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: error.message });
  }
};

// Get a diet plan by category to display
const getDietPlanByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const dietPlan = await DietPlan.findOne({ category });

    if (!dietPlan) {
      return res.status(404).json({ message: "Diet plan not found" });
    }
    res.json([dietPlan]);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching diet plan",
      error: error.message,
    });
  }
};

// Get All Diet Plans Created by a Trainer or Dietitian
const getTrainerDietPlans = async (req, res) => {
  try {
    if (!req.user || !["Trainer", "RD", "RDN"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Access denied. Trainers or Dietitians only." });
    }

    const dietPlans = await DietPlan.find({ trainer: req.user.id });
    res.status(200).json({ success: true, data: dietPlans });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching diet plans",
      error: error.message,
    });
  }
};

// Assign Diet Plan to a Member (Trainer or Dietitian)
const assignDietPlan = async (req, res) => {
  try {
    if (!req.user || !["Trainer", "RD", "RDN"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Access denied. Trainers or Dietitians only." });
    }

    const { memberId, dietPlanId } = req.body;

    // For Dietitians, verify member is assigned to them
    if (["RD", "RDN"].includes(req.user.role)) {
      const member = await User.findById(memberId);
      if (!member || member.assignedDietitian?.toString() !== req.user.id) {
        return res
          .status(403)
          .json({ message: "Member not assigned to you" });
      }
    }

    // Remove existing assignment if any
    await AssignedDietPlan.deleteMany({ member: memberId });

    const assignedPlan = new AssignedDietPlan({
      trainer: req.user.id,
      member: memberId,
      dietPlan: dietPlanId,
    });
    await assignedPlan.save();
    res.status(201).json({
      success: true,
      message: "Diet Plan assigned successfully",
      data: assignedPlan,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error assigning diet plan",
      error: error.message,
    });
  }
};

// Get All Assigned Diet Plans for a Member
const getMemberDietPlans = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "Member") {
      return res
        .status(403)
        .json({ message: "Access denied. Members only." });
    }

    const assignedPlans = await AssignedDietPlan.find({
      member: req.user.id,
    }).populate("dietPlan");
    res.status(200).json(assignedPlans);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching assigned diet plans",
      error: error.message,
    });
  }
};

// Get Diet Plan by ID
const getDietPlanById = async (req, res) => {
  try {
    const dietPlan = await DietPlan.findById(req.params.id).populate(
      "trainer",
      "name email"
    );
    if (!dietPlan)
      return res.status(404).json({ message: "Diet Plan not found" });
    res.json(dietPlan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Diet Plan (Trainer or Dietitian)
const updateDietPlan = async (req, res) => {
  try {
    if (!req.user || !["Trainer", "RD", "RDN"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Access denied. Trainers or Dietitians only." });
    }

    const { category, meals } = req.body;
    const dietPlan = await DietPlan.findById(req.params.id);
    if (!dietPlan) {
      return res.status(404).json({
        success: false,
        message: "Diet Plan not found",
      });
    }

    if (dietPlan.trainer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this plan",
      });
    }

    dietPlan.category = category || dietPlan.category;
    dietPlan.meals = meals || dietPlan.meals;

    await dietPlan.save();
    res.status(200).json({
      success: true,
      message: "Diet plan updated successfully",
      data: dietPlan,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: error.message });
  }
};

// Delete Diet Plan (Trainer or Dietitian)
const deleteDietPlan = async (req, res) => {
  try {
    if (!req.user || !["Trainer", "RD", "RDN"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Access denied. Trainers or Dietitians only." });
    }

    const dietPlan = await DietPlan.findById(req.params.id);
    if (!dietPlan) {
      return res.status(404).json({
        success: false,
        message: "Diet Plan not found",
      });
    }

    if (dietPlan.trainer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this plan",
      });
    }

    await dietPlan.deleteOne();
    res.status(200).json({
      success: true,
      message: "Diet Plan deleted successfully",
    });
  }catch (error) {
    res
      .status(500)
      .json({ success: false, message: error.message });
  }
};

// ========================================================
// Generate PDF for ONE diet plan
const generateSingleDietPlanPDF = async (req, res) => {
  try {
    const dietPlan = await DietPlan.findById(req.params.id).lean();
    if (!dietPlan) {
      return res.status(404).json({ message: "Diet plan not found" });
    }

    let pdfBytes = await generatePDF([dietPlan]); // might be Uint8Array
    const pdfBuffer = Buffer.isBuffer(pdfBytes)
      ? pdfBytes
      : Buffer.from(pdfBytes);

    // Debug: check first bytes
    console.log("PDF Buffer length:", pdfBuffer.length);
    console.log("PDF Header:", pdfBuffer.slice(0, 5).toString()); // should print '%PDF-'

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=diet-plan-${dietPlan._id}.pdf`
    );
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Error generating PDF:", err);
    res.status(500).json({
      message: "Error generating PDF",
      error: err.message,
    });
  }
};

// Generate PDF for MULTIPLE diet plans
const generateMultipleDietPlansPDF = async (req, res) => {
  try {
    const { category, trainerId } = req.query;
    let query = {};

    if (category) query.category = category;
    if (trainerId) query.trainer = trainerId;

    const dietPlans = await DietPlan.find(query).lean();
    if (!dietPlans.length) {
      return res.status(404).json({ message: "No diet plans found" });
    }

    let pdfBytes = await generatePDF(dietPlans);
    const pdfBuffer = Buffer.isBuffer(pdfBytes)
      ? pdfBytes
      : Buffer.from(pdfBytes);

    // Debug: check first bytes
    console.log("PDF Buffer length:", pdfBuffer.length);
    console.log("PDF Header:", pdfBuffer.slice(0, 5).toString());

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=diet-plans.pdf`
    );
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Error generating PDF:", err);
    res.status(500).json({
      message: "Error generating PDF",
      error: err.message,
    });
  }
};

module.exports = {
  createDietPlan,
  getAllDietPlans,
  getDietPlanByCategory,
  getTrainerDietPlans,
  assignDietPlan,
  getMemberDietPlans,
  getDietPlanById,
  updateDietPlan,
  deleteDietPlan,
  generateSingleDietPlanPDF,
  generateMultipleDietPlansPDF,
};
