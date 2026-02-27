// backend/models/UserMembership.js
const mongoose = require("mongoose");
const MembershipPlan = require("./MembershipPlan");

const UserMembershipSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    membershipPlan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "membership_plans",
        required: true
    },
    startDate: {
        type: Date,
        default: Date.now,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    },
    withPersonalTrainer: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: false // Start as inactive until payment is made
    },
    autoRenew: {
        type: Boolean,
        default: true
    },
    cancelledAt: {
        type: Date,
        default: null
    }
});

// Automatically set the end date and calculate total price
UserMembershipSchema.pre("validate", async function (next) {
  if (this.isNew) {
    try {
      const membership = await MembershipPlan.findById(this.membershipPlan);
      if (membership) {
        this.endDate = new Date(this.startDate);
        this.endDate.setMonth(this.endDate.getMonth() + membership.duration);
        
        // Calculate base price
        let basePrice = membership.price;
        
        // Add personal trainer charge if selected
        if (this.withPersonalTrainer && membership.personalTrainerCharge) {
          basePrice += membership.personalTrainerCharge;
        }
        
        // Apply discount if exists (parse percentage or fixed amount)
        if (membership.discount) {
          const discountStr = membership.discount.toString().trim();
          const hasPercent = discountStr.includes('%');
          const numericValue = parseFloat(discountStr.replace(/[^0-9.]/g, ''));
          
          if (!isNaN(numericValue)) {
            if (hasPercent) {
              // Percentage discount (e.g., "5%", "5% off")
              basePrice = basePrice * (1 - numericValue / 100);
            } else {
              // If no % symbol, check if it's likely a percentage (small number) or fixed amount
              // If value is <= 100, assume it's a percentage (common discount range: 5%, 10%, 20%, etc.)
              // If value is > 100, assume it's a fixed amount in rupees
              if (numericValue <= 100) {
                // Treat as percentage
                basePrice = basePrice * (1 - numericValue / 100);
              } else {
                // Treat as fixed amount
                basePrice = Math.max(0, basePrice - numericValue);
              }
            }
          }
        }
        
        this.totalPrice = Math.round(basePrice * 100) / 100; // Round to 2 decimal places
      }
    } catch (err) {
      return next(err);
    }
  }
  next();
});


module.exports = mongoose.model("user_memberships", UserMembershipSchema);