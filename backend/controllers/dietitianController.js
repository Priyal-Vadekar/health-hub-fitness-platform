// backend/controllers/dietitianController.js
const mongoose = require("mongoose");
const User = require("../models/User");
const MealLog = require("../models/MealLog");
const UserProgress = require("../models/UserProgress");
const AssignedDietPlan = require("../models/AssignedDietPlan");
const DietPlan = require("../models/DietPlans");
const DosDonts = require("../models/DosDonts");

// Get assigned members for Dietitian
exports.getAssignedMembers = async (req, res) => {
  try {
    const dietitianId = req.user.id;

    const members = await User.find({
      assignedDietitian: dietitianId,
      role: "Member"
    }).select("name email profilePic");

    // Get additional info for each member
    const membersWithInfo = await Promise.all(
      members.map(async (member) => {
        const assignedPlan = await AssignedDietPlan.findOne({
          member: member._id
        }).populate("dietPlan");

        // Get latest progress
        const latestProgress = await UserProgress.findOne({
          user: member._id
        }).sort({ date: -1 });

        // Calculate meal adherence (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const mealLogs = await MealLog.find({
          user: member._id,
          date: { $gte: sevenDaysAgo }
        });

        let adherenceCount = 0;
        let totalMeals = 0;
        mealLogs.forEach((log) => {
          log.meals.forEach((meal) => {
            totalMeals++;
            if (meal.isFromPlan) adherenceCount++;
          });
        });

        const adherence = totalMeals > 0 ? (adherenceCount / totalMeals) * 100 : 0;

        return {
          ...member.toObject(),
          currentDietPlan: assignedPlan?.dietPlan || null,
          latestWeight: latestProgress?.weight || null,
          adherence: Math.round(adherence),
          status:
            adherence >= 70
              ? "ok"
              : adherence >= 50
              ? "warning"
              : "needs_attention"
        };
      })
    );

    res.status(200).json({
      success: true,
      data: membersWithInfo
    });
  } catch (error) {
    console.error("Get assigned members error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get member summary for Dietitian
exports.getMemberSummary = async (req, res) => {
  try {
    const { memberId } = req.params;
    const dietitianId = req.user.id;

    // Verify member is assigned to this dietitian
    const member = await User.findById(memberId);
    if (!member || member.assignedDietitian?.toString() !== dietitianId) {
      return res.status(403).json({ message: "Member not assigned to you" });
    }

    // Get assigned diet plan
    const assignedPlan = await AssignedDietPlan.findOne({
      member: memberId
    }).populate("dietPlan");

    // Get progress data
    const progress = await UserProgress.find({
      user: memberId
    }).sort({ date: 1 });

    // Get meal logs (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const mealLogs = await MealLog.find({
      user: memberId,
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: -1 });

    // Get Do's & Don'ts
    const dosDonts = await DosDonts.findOne({ user: memberId });

    res.status(200).json({
      success: true,
      data: {
        member: {
          name: member.name,
          email: member.email,
          profilePic: member.profilePic
        },
        dietPlan: assignedPlan?.dietPlan || null,
        progress,
        mealLogs,
        dosDonts: dosDonts || { dos: [], donts: [] }
      }
    });
  } catch (error) {
    console.error("Get member summary error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get meal logs for Dietitian review - only assigned members
exports.getMealLogsForReview = async (req, res) => {
  try {
    const { memberId, startDate, endDate } = req.query;
    const dietitianId = req.user.id;

    // Get all assigned member IDs
    const assignedMembers = await User.find({
      assignedDietitian: dietitianId,
      role: "Member"
    }).select("_id");

    const assignedMemberIds = assignedMembers.map((m) => m._id);

    if (assignedMemberIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    // Build query - only assigned members
    const query = { user: { $in: assignedMemberIds } };

    if (memberId) {
      // Verify member is assigned - convert to string for comparison
      const memberIdObj = mongoose.Types.ObjectId.isValid(memberId)
        ? new mongoose.Types.ObjectId(memberId)
        : memberId;
      const memberIdStr = memberIdObj.toString();
      const assignedIdsStr = assignedMemberIds.map((id) => id.toString());
      if (!assignedIdsStr.includes(memberIdStr)) {
        return res.status(403).json({ message: "Member not assigned to you" });
      }
      query.user = memberIdObj;
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const mealLogs = await MealLog.find(query)
      .populate("user", "name email")
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: mealLogs
    });
  } catch (error) {
    console.error("Get meal logs for review error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Add feedback to meal log
exports.addMealLogFeedback = async (req, res) => {
  try {
    const { mealLogId } = req.params;
    const { rating, notes } = req.body;
    const dietitianId = req.user.id;

    if (!rating || !["good", "average", "poor"].includes(rating)) {
      return res
        .status(400)
        .json({ message: "Valid rating required (good/average/poor)" });
    }

    const mealLog = await MealLog.findById(mealLogId);
    if (!mealLog) {
      return res.status(404).json({ message: "Meal log not found" });
    }

    // Verify member is assigned to this dietitian
    const member = await User.findById(mealLog.user);
    if (!member || member.assignedDietitian?.toString() !== dietitianId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    mealLog.feedback = {
      rating,
      notes: notes || "",
      givenBy: dietitianId,
      givenAt: new Date()
    };

    await mealLog.save();

    res.status(200).json({
      success: true,
      message: "Feedback added",
      data: mealLog
    });
  } catch (error) {
    console.error("Add meal log feedback error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Generate member report
exports.generateMemberReport = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { startDate, endDate } = req.query;
    const dietitianId = req.user.id;

    const member = await User.findById(memberId);
    if (!member || member.assignedDietitian?.toString() !== dietitianId) {
      return res.status(403).json({ message: "Member not assigned to you" });
    }

    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Get progress data
    const progress = await UserProgress.find({
      user: memberId,
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });

    // Get meal logs
    const mealLogs = await MealLog.find({
      user: memberId,
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });

    // Calculate statistics
    let totalCalories = 0;
    let totalMeals = 0;
    let planMeals = 0;
    const dailyCalories = [];
    const dailyAdherence = [];

    mealLogs.forEach((log) => {
      const dayCalories = log.meals.reduce(
        (sum, meal) => sum + (meal.calories || 0),
        0
      );
      totalCalories += dayCalories;
      dailyCalories.push({ date: log.date, calories: dayCalories });

      const dayMeals = log.meals.length;
      const dayPlanMeals = log.meals.filter((m) => m.isFromPlan).length;
      totalMeals += dayMeals;
      planMeals += dayPlanMeals;
      dailyAdherence.push({
        date: log.date,
        adherence: dayMeals > 0 ? (dayPlanMeals / dayMeals) * 100 : 0
      });
    });

    const avgCalories =
      mealLogs.length > 0 ? totalCalories / mealLogs.length : 0;
    const avgAdherence = totalMeals > 0 ? (planMeals / totalMeals) * 100 : 0;

    // Weight change
    const firstWeight = progress.length > 0 ? progress[0].weight : null;
    const lastWeight =
      progress.length > 0 ? progress[progress.length - 1].weight : null;
    const weightChange =
      firstWeight != null && lastWeight != null
        ? lastWeight - firstWeight
        : null;

    // Most frequent foods
    const foodFrequency = {};
    mealLogs.forEach((log) => {
      log.meals.forEach((meal) => {
        if (meal.name) {
          foodFrequency[meal.name] = (foodFrequency[meal.name] || 0) + 1;
        }
      });
    });
    const topFoods = Object.entries(foodFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    res.status(200).json({
      success: true,
      data: {
        member: {
          name: member.name,
          email: member.email
        },
        period: { start, end },
        statistics: {
          avgCalories: Math.round(avgCalories),
          avgAdherence: Math.round(avgAdherence),
          weightChange,
          firstWeight,
          lastWeight,
          totalMeals,
          planMeals
        },
        charts: {
          dailyCalories,
          dailyAdherence,
          weightTrend: progress.map((p) => ({
            date: p.date,
            weight: p.weight
          }))
        },
        topFoods
      }
    });
  } catch (error) {
    console.error("Generate member report error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
