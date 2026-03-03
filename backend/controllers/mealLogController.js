// backend/controllers/mealLogController.js
const MealLog = require("../models/MealLog");
const AssignedDietPlan = require("../models/AssignedDietPlan");
const DietPlan = require("../models/DietPlans");

// ── HELPER: parse date string to local midnight UTC ──────────────────────────
// Dates come in as "2026-03-02" from frontend. new Date("2026-03-02") in Node
// creates midnight UTC which may differ from the user's local date. We need to
// compare the same date as stored when the meal was first added.
const parseDateToMidnight = (dateStr) => {
  const d = new Date(dateStr);
  d.setUTCHours(0, 0, 0, 0); // normalise to midnight UTC consistently
  return d;
};

// ── HELPER: map any meal time description to a valid enum value ───────────────
// The MealLog schema only allows: Breakfast | Lunch | Dinner | Snack
// Diet plans use values like "Early Morning", "Pre-Workout", "Post-Workout" etc.
// This maps them safely so the save doesn't throw a validation error (Bug 02).
const mapTimeOfDay = (raw) => {
  if (!raw) return "Snack";
  const val = raw.toLowerCase();
  if (val.includes("breakfast") || val.includes("morning")) return "Breakfast";
  if (val.includes("lunch") || val.includes("afternoon") || val.includes("mid")) return "Lunch";
  if (val.includes("dinner") || val.includes("evening") || val.includes("night")) return "Dinner";
  return "Snack"; // fallback for Pre-Workout, Post-Workout, etc.
};

// Get meal logs for a user (by date range)
exports.getMealLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;
    const query = { user: userId };
    if (startDate && endDate) {
      query.date = {
        $gte: parseDateToMidnight(startDate),
        $lte: parseDateToMidnight(endDate)
      };
    }
    const mealLogs = await MealLog.find(query).sort({ date: -1 }).populate("meals.dietPlanId", "category");
    res.status(200).json({ success: true, data: mealLogs });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get meal log for a specific date — returns empty success instead of 404 so
// frontend doesn't need to treat 404 as "no log" (Bug 03 fix)
exports.getMealLogByDate = async (req, res) => {
  try {
    const userId = req.user.id;
    const targetDate = parseDateToMidnight(req.params.date);

    const mealLog = await MealLog.findOne({ user: userId, date: targetDate })
      .populate("meals.dietPlanId", "category");

    if (!mealLog) {
      // Return empty success so frontend doesn't crash on 404
      return res.status(200).json({
        success: true,
        data: { _id: null, meals: [], date: req.params.date }
      });
    }

    res.status(200).json({ success: true, data: mealLog });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Add a meal to a day's log
exports.addMeal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, calories, macros, time, timeOfDay, isFromPlan, dietPlanId, notes, date } = req.body;

    if (!name || !time) {
      return res.status(400).json({ success: false, message: "Name and time are required" });
    }

    const targetDate = parseDateToMidnight(date || new Date().toISOString().split("T")[0]);

    // ── FIX (Bug 02): map timeOfDay to valid enum before saving
    const safeTimeOfDay = mapTimeOfDay(timeOfDay);

    let mealLog = await MealLog.findOne({ user: userId, date: targetDate });

    if (!mealLog) {
      mealLog = new MealLog({ user: userId, date: targetDate, meals: [] });
    }

    mealLog.meals.push({
      name,
      calories: calories || 0,
      macros: macros || { protein: 0, carbs: 0, fats: 0 },
      time: time || "12:00",
      timeOfDay: safeTimeOfDay,
      isFromPlan: isFromPlan || false,
      isCustom: !isFromPlan,
      dietPlanId: dietPlanId || null,
      notes: notes || ""
    });

    await mealLog.save();
    res.status(201).json({ success: true, message: "Meal added successfully", data: mealLog });
  } catch (error) {
    console.error("Add meal error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get assigned diet plan meals for the checklist
// ── FIX (Bug 02): no longer crashes when dietPlan meals use non-enum timeOfDay values
exports.getDietPlanMeals = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.query;

    // Try all roles — member is in User.role not AssignedDietPlan separately
    const assignedPlan = await AssignedDietPlan.findOne({ member: userId }).populate("dietPlan");

    if (!assignedPlan || !assignedPlan.dietPlan) {
      return res.status(200).json({
        success: true,
        data: { meals: [], hasPlan: false }
      });
    }

    const dietPlan = assignedPlan.dietPlan;

    // Get today's meal log to check which meals are already logged
    const today = parseDateToMidnight(date || new Date().toISOString().split("T")[0]);
    const todayLog = await MealLog.findOne({ user: userId, date: today });
    const loggedMealNames = todayLog ? todayLog.meals.map(m => m.name.toLowerCase()) : [];

    // Map diet plan meals with completion status — preserve original timeOfDay label for display
    const mealsWithStatus = (dietPlan.meals || []).map(mealGroup => ({
      timeOfDay: mealGroup.timeOfDay,   // keep original label e.g. "Early Morning"
      items: (mealGroup.items || []).map(item => ({
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

    const mealLog = await MealLog.findOne({ _id: mealLogId, user: userId });
    if (!mealLog) return res.status(404).json({ success: false, message: "Meal log not found" });

    const mealIndex = mealLog.meals.findIndex(meal => meal._id.toString() === mealId);
    if (mealIndex === -1) return res.status(404).json({ success: false, message: "Meal not found" });

    if (name) mealLog.meals[mealIndex].name = name;
    if (calories !== undefined) mealLog.meals[mealIndex].calories = calories;
    if (macros) mealLog.meals[mealIndex].macros = macros;
    if (time) mealLog.meals[mealIndex].time = time;
    if (timeOfDay) mealLog.meals[mealIndex].timeOfDay = mapTimeOfDay(timeOfDay);
    if (notes !== undefined) mealLog.meals[mealIndex].notes = notes;

    await mealLog.save();
    res.status(200).json({ success: true, message: "Meal updated successfully", data: mealLog });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Delete a meal from log
exports.deleteMeal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { mealLogId, mealId } = req.params;

    const mealLog = await MealLog.findOne({ _id: mealLogId, user: userId });
    if (!mealLog) return res.status(404).json({ success: false, message: "Meal log not found" });

    mealLog.meals = mealLog.meals.filter(meal => meal._id.toString() !== mealId);
    await mealLog.save();

    res.status(200).json({ success: true, message: "Meal deleted successfully", data: mealLog });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get my meal logs
exports.getMyMealLogs = async (req, res) => {
  try {
    const mealLogs = await MealLog.find({ user: req.user.id })
      .sort({ date: -1 })
      .populate("meals.dietPlanId", "category");
    res.status(200).json({ success: true, data: mealLogs });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};