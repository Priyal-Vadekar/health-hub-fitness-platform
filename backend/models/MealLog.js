// backend/models/MealLog.js
const mongoose = require("mongoose");

const MealLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  meals: [
    {
      name: {
        type: String,
        required: true
      },
      calories: {
        type: Number,
        default: 0
      },
      macros: {
        protein: { type: Number, default: 0 },
        carbs: { type: Number, default: 0 },
        fats: { type: Number, default: 0 }
      },
      time: {
        type: String, // e.g., "08:00", "12:30", "19:00"
        required: true
      },
      timeOfDay: {
        type: String,
        enum: ["Breakfast", "Lunch", "Dinner", "Snack"],
        required: true
      },
      isFromPlan: {
        type: Boolean,
        default: false
      },
      isCustom: {
        type: Boolean,
        default: false
      },
      dietPlanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "diet_plans",
        default: null
      },
      notes: {
        type: String,
        default: ""
      }
    }
  ],
  totalCalories: {
    type: Number,
    default: 0
  },
  totalMacros: {
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fats: { type: Number, default: 0 }
  },
  feedback: {
    rating: {
      type: String,
      enum: ["good", "average", "poor"],
      default: null
    },
    notes: {
      type: String,
      default: null
    },
    givenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      default: null
    },
    givenAt: {
      type: Date,
      default: null
    }
  }
}, {
  timestamps: true
});

// Calculate totals before saving
MealLogSchema.pre("save", function(next) {
  if (this.meals && this.meals.length > 0) {
    this.totalCalories = this.meals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
    this.totalMacros = {
      protein: this.meals.reduce((sum, meal) => sum + (meal.macros?.protein || 0), 0),
      carbs: this.meals.reduce((sum, meal) => sum + (meal.macros?.carbs || 0), 0),
      fats: this.meals.reduce((sum, meal) => sum + (meal.macros?.fats || 0), 0)
    };
  }
  next();
});

module.exports = mongoose.model("meal_logs", MealLogSchema);

