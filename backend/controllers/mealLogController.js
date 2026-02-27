// backend/controllers/mealLogController.js
const MealLog = require("../models/MealLog");
const AssignedDietPlan = require("../models/AssignedDietPlan");
const DietPlan = require("../models/DietPlans");

// Get meal logs for a user (by date range)
exports.getMealLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    const query = { user: userId };
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const mealLogs = await MealLog.find(query)
      .sort({ date: -1 })
      .populate("meals.dietPlanId", "category");

    res.status(200).json({
      success: true,
      data: mealLogs
    });
  } catch (error) {
    console.error("Get meal logs error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get meal log for a specific date
exports.getMealLogByDate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.params;

    const mealLog = await MealLog.findOne({
      user: userId,
      date: new Date(date)
    }).populate("meals.dietPlanId", "category");

    if (!mealLog) {
      return res.status(404).json({ success: false, message: "Meal log not found for this date" });
    }

    res.status(200).json({
      success: true,
      data: mealLog
    });
  } catch (error) {
    console.error("Get meal log by date error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Add a meal to today's log
exports.addMeal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, calories, macros, time, timeOfDay, isFromPlan, dietPlanId, notes, date } = req.body;

    if (!name || !time || !timeOfDay) {
      return res.status(400).json({ success: false, message: "Name, time, and timeOfDay are required" });
    }

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    let mealLog = await MealLog.findOne({
      user: userId,
      date: targetDate
    });

    if (!mealLog) {
      mealLog = new MealLog({
        user: userId,
        date: targetDate,
        meals: []
      });
    }

    mealLog.meals.push({
      name,
      calories: calories || 0,
      macros: macros || { protein: 0, carbs: 0, fats: 0 },
      time,
      timeOfDay,
      isFromPlan: isFromPlan || false,
      isCustom: !isFromPlan,
      dietPlanId: dietPlanId || null,
      notes: notes || ""
    });

    await mealLog.save();

    res.status(201).json({
      success: true,
      message: "Meal added successfully",
      data: mealLog
    });
  } catch (error) {
    console.error("Add meal error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get assigned diet plan meals for checklist
exports.getDietPlanMeals = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.query;

    const assignedPlan = await AssignedDietPlan.findOne({
      member: userId
    }).populate("dietPlan");

    if (!assignedPlan) {
      return res.status(200).json({
        success: true,
        data: { meals: [], hasPlan: false }
      });
    }

    const dietPlan = await DietPlan.findById(assignedPlan.dietPlan);
    if (!dietPlan) {
      return res.status(404).json({ success: false, message: "Diet plan not found" });
    }

    // Get today's meal log to check which meals are already logged
    const today = date ? new Date(date) : new Date();
    today.setHours(0, 0, 0, 0);

    const todayLog = await MealLog.findOne({
      user: userId,
      date: today
    });

    const loggedMealNames = todayLog ? todayLog.meals.map(m => m.name.toLowerCase()) : [];

    // Map diet plan meals with completion status
    const mealsWithStatus = dietPlan.meals.map(mealGroup => ({
      timeOfDay: mealGroup.timeOfDay,
      items: mealGroup.items.map(item => ({
        name: item,
        isLogged: loggedMealNames.includes(item.toLowerCase())
      }))
    }));

    res.status(200).json({
      success: true,
      data: {
        meals: mealsWithStatus,
        hasPlan: true,
        dietPlanId: dietPlan._id
      }
    });
  } catch (error) {
    console.error("Get diet plan meals error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Update a meal in log
exports.updateMeal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { mealLogId, mealId } = req.params;
    const { name, calories, macros, time, timeOfDay, notes } = req.body;

    const mealLog = await MealLog.findOne({
      _id: mealLogId,
      user: userId
    });

    if (!mealLog) {
      return res.status(404).json({ success: false, message: "Meal log not found" });
    }

    const mealIndex = mealLog.meals.findIndex(meal => meal._id.toString() === mealId);
    if (mealIndex === -1) {
      return res.status(404).json({ success: false, message: "Meal not found" });
    }

    // Update meal fields
    if (name) mealLog.meals[mealIndex].name = name;
    if (calories !== undefined) mealLog.meals[mealIndex].calories = calories;
    if (macros) mealLog.meals[mealIndex].macros = macros;
    if (time) mealLog.meals[mealIndex].time = time;
    if (timeOfDay) mealLog.meals[mealIndex].timeOfDay = timeOfDay;
    if (notes !== undefined) mealLog.meals[mealIndex].notes = notes;

    // Recalculate totals
    const totals = mealLog.meals.reduce((acc, meal) => {
      acc.calories += meal.calories || 0;
      acc.macros.protein += meal.macros?.protein || 0;
      acc.macros.carbs += meal.macros?.carbs || 0;
      acc.macros.fats += meal.macros?.fats || 0;
      return acc;
    }, { calories: 0, macros: { protein: 0, carbs: 0, fats: 0 } });
    
    mealLog.totalCalories = totals.calories;
    mealLog.totalMacros = totals.macros;

    await mealLog.save();

    res.status(200).json({
      success: true,
      message: "Meal updated successfully",
      data: mealLog
    });
  } catch (error) {
    console.error("Update meal error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Delete a meal from log
exports.deleteMeal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { mealLogId, mealId } = req.params;

    const mealLog = await MealLog.findOne({
      _id: mealLogId,
      user: userId
    });

    if (!mealLog) {
      return res.status(404).json({ success: false, message: "Meal log not found" });
    }

    mealLog.meals = mealLog.meals.filter(meal => meal._id.toString() !== mealId);
    await mealLog.save();

    res.status(200).json({
      success: true,
      message: "Meal deleted successfully",
      data: mealLog
    });
  } catch (error) {
    console.error("Delete meal error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get my meal logs (for member)
exports.getMyMealLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const mealLogs = await MealLog.find({ user: userId })
      .sort({ date: -1 })
      .populate("meals.dietPlanId", "category");

    res.status(200).json({
      success: true,
      data: mealLogs
    });
  } catch (error) {
    console.error("Get my meal logs error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
