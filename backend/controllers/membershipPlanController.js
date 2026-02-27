const MembershipPlan = require("../models/MembershipPlan");

// Get all membership plans
exports.getAllPlans = async (req, res) => {
  try {
    const plans = await MembershipPlan.find();
    res.status(200).json(plans);
  } catch (error) {
    res.status(500).json({ message: "Error fetching plans", error });
  }
};

// Get a single membership plan by ID
exports.getPlanById = async (req, res) => {
  try {
    const plan = await MembershipPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }
    res.status(200).json(plan);
  } catch (error) {
    res.status(500).json({ message: "Error fetching plan", error });
  }
};

// Create a new membership plan
exports.createPlan = async (req, res) => {
  try {
    const newPlan = new MembershipPlan(req.body);
    await newPlan.save();
    res.status(201).json(newPlan);
  } catch (error) {
    res.status(400).json({ message: "Error creating plan", error });
  }
};

// Update a membership plan
exports.updatePlan = async (req, res) => {
  try {
    const updatedPlan = await MembershipPlan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedPlan) {
      return res.status(404).json({ message: "Plan not found" });
    }
    res.status(200).json(updatedPlan);
  } catch (error) {
    res.status(400).json({ message: "Error updating plan", error });
  }
};

// Delete a membership plan
exports.deletePlan = async (req, res) => {
  try {
    const deletedPlan = await MembershipPlan.findByIdAndDelete(req.params.id);
    if (!deletedPlan) {
      return res.status(404).json({ message: "Plan not found" });
    }
    res.status(200).json({ message: "Plan deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting plan", error });
  }
};
