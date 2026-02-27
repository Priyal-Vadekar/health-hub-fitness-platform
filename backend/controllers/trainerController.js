// backend/controllers/trainerController.js
const User = require("../models/User");
const UserProgress = require("../models/UserProgress");
const MealLog = require("../models/MealLog");
const AssignedDietPlan = require("../models/AssignedDietPlan");

// Get assigned members for Trainer
exports.getAssignedMembers = async (req, res) => {
  try {
    const trainerId = req.user.id;

    const members = await User.find({
      assignedTrainer: trainerId,
      role: "Member",
    }).select("name email profilePic");

    // Get additional info for each member
    const membersWithInfo = await Promise.all(
      members.map(async (member) => {
        // Get latest progress
        const latestProgress = await UserProgress.findOne({
          user: member._id,
        }).sort({ date: -1 });

        // Get assigned diet plan
        const assignedPlan = await AssignedDietPlan.findOne({
          member: member._id,
        }).populate("dietPlan");

        // Calculate meal adherence (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const mealLogs = await MealLog.find({
          user: member._id,
          date: { $gte: sevenDaysAgo },
        });

        let adherenceCount = 0;
        let totalMeals = 0;
        mealLogs.forEach((log) => {
          log.meals.forEach((meal) => {
            totalMeals++;
            if (meal.isFromPlan) adherenceCount++;
          });
        });

        const adherence =
          totalMeals > 0 ? (adherenceCount / totalMeals) * 100 : 0;

        return {
          ...member.toObject(),
          latestWeight: latestProgress?.weight || null,
          latestBodyFat: latestProgress?.bodyFatPercentage || null,
          currentDietPlan: assignedPlan?.dietPlan?.category || null,
          mealAdherence: Math.round(adherence),
        };
      })
    );

    res.status(200).json({
      success: true,
      data: membersWithInfo,
    });
  } catch (error) {
    console.error("Get assigned members error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get member progress for Trainer
exports.getMemberProgress = async (req, res) => {
  try {
    const { memberId } = req.params;
    const trainerId = req.user.id;

    // Verify member is assigned to this trainer
    const member = await User.findById(memberId);
    if (!member || member.assignedTrainer?.toString() !== trainerId) {
      return res.status(403).json({ message: "Member not assigned to you" });
    }

    // Get progress data
    const progress = await UserProgress.find({
      user: memberId,
    }).sort({ date: 1 });

    // Get meal logs (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const mealLogs = await MealLog.find({
      user: memberId,
      date: { $gte: thirtyDaysAgo },
    }).sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: {
        member: {
          name: member.name,
          email: member.email,
          profilePic: member.profilePic,
        },
        progress,
        mealLogs: mealLogs.slice(0, 10), // Last 10 meal logs
      },
    });
  } catch (error) {
    console.error("Get member progress error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};




