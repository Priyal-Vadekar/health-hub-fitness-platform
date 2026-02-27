// backend\controllers\assignedDietPlanController.js
const AssignedDietPlan = require("../models/AssignedDietPlan");

// Get all assigned diet plans (Admin only)
const getAllAssignedDietPlans = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "Admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    const assignedPlans = await AssignedDietPlan.find()
      .populate("trainer", "name email")
      .populate("member", "name email")
      .populate("dietPlan");

    res.status(200).json(assignedPlans);
  } catch (error) {
    res.status(500).json({ message: "Error fetching assigned diet plans", error: error.message });
  }
};

// Get assigned diet plans for a member
const getMemberDietPlans = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "Member") {
      return res.status(403).json({ message: "Access denied. Members only." });
    }

    const assignedPlans = await AssignedDietPlan.find({ member: req.user.id }).populate("dietPlan");
    res.status(200).json(assignedPlans);
  } catch (error) {
    res.status(500).json({ message: "Error fetching assigned diet plans", error: error.message });
  }
};

// Assign a diet plan to a member (Trainer only)
const assignDietPlan = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "Trainer") {
      return res.status(403).json({ message: "Access denied. Trainers only." });
    }

    const { memberId, dietPlanId } = req.body;
    const assignedPlan = new AssignedDietPlan({ trainer: req.user.id, member: memberId, dietPlan: dietPlanId });

    await assignedPlan.save();
    res.status(201).json({ message: "Diet Plan assigned successfully", assignedPlan });
  } catch (error) {
    res.status(500).json({ message: "Error assigning diet plan", error: error.message });
  }
};

// Delete an assigned diet plan (Trainer or Admin)
const deleteAssignedDietPlan = async (req, res) => {
  try {
    const assignedPlan = await AssignedDietPlan.findById(req.params.id);
    if (!assignedPlan) return res.status(404).json({ message: "Assigned diet plan not found" });

    if (req.user.role !== "Admin" && assignedPlan.trainer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete this assigned plan" });
    }

    await assignedPlan.deleteOne();
    res.json({ message: "Assigned diet plan deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting assigned diet plan", error: error.message });
  }
};

// Diet Plan Popularity Report
const getDietPlanPopularity = async (req, res) => {
  try {
    const popularity = await AssignedDietPlan.aggregate([
      { $group: { _id: "$dietPlan", count: { $sum: 1 } } },
      {
        $lookup: {
          from: "diet_plans",
          localField: "_id",
          foreignField: "_id",
          as: "plan"
        }
      },
      { $unwind: "$plan" },
      {
        $project: {
          _id: 0,
          dietPlanId: "$plan._id",
          category: "$plan.category",
          count: 1
        }
      },
      { $sort: { count: -1 } }
    ]);
    res.json({ success: true, data: popularity });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error generating diet plan popularity report', error: err.message });
  }
};

module.exports = { getAllAssignedDietPlans, getMemberDietPlans, assignDietPlan, deleteAssignedDietPlan, getDietPlanPopularity };
