// backend/controllers/userProgressController.js
const UserProgress = require("../models/UserProgress");
const User = require("../models/User");

// Get progress entries for a user
exports.getProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    const query = { user: userId };
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const progress = await UserProgress.find(query).sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: progress,
    });
  } catch (error) {
    console.error("Get progress error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Add or update progress entry
exports.addProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      date,
      weight,
      bodyFatPercentage,
      bmi,
      waterIntake,
      workoutAdherence,
      notes,
      measurements,
    } = req.body;

    const progressDate = date ? new Date(date) : new Date();
    progressDate.setHours(0, 0, 0, 0);

    // Calculate BMI if weight is provided (assuming height is in user profile)
    let calculatedBMI = bmi;
    if (weight && !bmi) {
      const user = await User.findById(userId);
      // TODO: if you store height in User, calculate BMI here
      // calculatedBMI = ...
    }

    const progress = await UserProgress.findOneAndUpdate(
      { user: userId, date: progressDate },
      {
        weight: weight || null,
        bodyFatPercentage: bodyFatPercentage || null,
        bmi: calculatedBMI || null,
        waterIntake: waterIntake || 0,
        workoutAdherence: workoutAdherence || 0,
        notes: notes || "",
        measurements: measurements || {},
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: "Progress saved successfully",
      data: progress,
    });
  } catch (error) {
    console.error("Add progress error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get progress summary (for charts)
exports.getProgressSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    const progress = await UserProgress.find({
      user: userId,
      date: { $gte: startDate },
    }).sort({ date: 1 });

    const summary = {
      weight: progress
        .map((p) => ({ date: p.date, value: p.weight }))
        .filter((p) => p.value),
      bodyFat: progress
        .map((p) => ({ date: p.date, value: p.bodyFatPercentage }))
        .filter((p) => p.value),
      bmi: progress
        .map((p) => ({ date: p.date, value: p.bmi }))
        .filter((p) => p.value),
      waterIntake: progress.map((p) => ({
        date: p.date,
        value: p.waterIntake,
      })),
      workoutAdherence: progress.map((p) => ({
        date: p.date,
        value: p.workoutAdherence,
      })),
    };

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("Get progress summary error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete progress entry
exports.deleteProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { progressId } = req.params;

    const progress = await UserProgress.findOneAndDelete({
      _id: progressId,
      user: userId,
    });

    if (!progress) {
      return res.status(404).json({ message: "Progress entry not found" });
    }

    res.status(200).json({
      success: true,
      message: "Progress entry deleted successfully",
    });
  } catch (error) {
    console.error("Delete progress error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};




