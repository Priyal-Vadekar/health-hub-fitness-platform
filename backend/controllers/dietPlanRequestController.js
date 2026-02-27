// backend/controllers/dietPlanRequestController.js
const DietPlanRequest = require("../models/DietPlanRequest");
const User = require("../models/User");

// Create a diet plan request (Member)
exports.createDietPlanRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { weight, height, goal, dietType, allergies, foodDislikes, medicalNotes } = req.body;

    if (!weight || !height || !goal || !dietType) {
      return res.status(400).json({ success: false, message: "Weight, height, goal, and diet type are required" });
    }

    // Check if user already has a pending request
    const existingRequest = await DietPlanRequest.findOne({
      user: userId,
      status: "pending"
    });

    if (existingRequest) {
      return res.status(400).json({ success: false, message: "You already have a pending diet plan request" });
    }

    const newRequest = new DietPlanRequest({
      user: userId,
      weight,
      height,
      goal,
      dietType,
      allergies: allergies || "",
      foodDislikes: foodDislikes || "",
      medicalNotes: medicalNotes || ""
    });

    await newRequest.save();

    res.status(201).json({ success: true, message: "Diet plan request submitted successfully", data: newRequest });
  } catch (error) {
    console.error("Error creating diet plan request:", error);
    res.status(500).json({ success: false, message: "Failed to create diet plan request", error: error.message });
  }
};

// Get user's diet plan request (Member)
exports.getMyDietPlanRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const request = await DietPlanRequest.findOne({ user: userId })
      .populate("assignedDietitian", "name email")
      .populate("assignedDietPlan")
      .sort({ createdAt: -1 });

    if (!request) {
      return res.status(200).json({ success: true, data: null });
    }

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    console.error("Error fetching diet plan request:", error);
    res.status(500).json({ success: false, message: "Failed to fetch diet plan request", error: error.message });
  }
};

// Get all pending requests (Dietitian/Admin)
exports.getAllRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) {
      query.status = status;
    }

    const requests = await DietPlanRequest.find(query)
      .populate("user", "name email")
      .populate("assignedDietitian", "name email")
      .populate("assignedDietPlan")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    console.error("Error fetching diet plan requests:", error);
    res.status(500).json({ success: false, message: "Failed to fetch requests", error: error.message });
  }
};

// Assign diet plan to request (Dietitian)
exports.assignDietPlanToRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { dietPlanId } = req.body;
    const dietitianId = req.user.id;

    const request = await DietPlanRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    // Verify member is assigned to this dietitian
    const member = await User.findById(request.user);
    if (member.assignedDietitian?.toString() !== dietitianId) {
      return res.status(403).json({ success: false, message: "Member not assigned to you" });
    }

    request.assignedDietPlan = dietPlanId;
    request.assignedDietitian = dietitianId;
    request.status = "assigned";
    request.assignedAt = new Date();

    await request.save();

    // Also assign the diet plan to the member
    const AssignedDietPlan = require("../models/AssignedDietPlan");
    await AssignedDietPlan.deleteMany({ member: request.user });
    const assignedPlan = new AssignedDietPlan({
      trainer: dietitianId,
      member: request.user,
      dietPlan: dietPlanId
    });
    await assignedPlan.save();

    res.status(200).json({ success: true, message: "Diet plan assigned successfully", data: request });
  } catch (error) {
    console.error("Error assigning diet plan:", error);
    res.status(500).json({ success: false, message: "Failed to assign diet plan", error: error.message });
  }
};
