// backend/models/TrainerBooking.js
const mongoose = require("mongoose");

const TrainerBookingSchema = new mongoose.Schema(
  {
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    timeSlot: {
      start: {
        type: String, // e.g., "09:00"
        required: true,
      },
      end: {
        type: String, // e.g., "10:00"
        required: true,
      },
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
      index: true,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "payments",
      default: null,
    },
    sessionPrice: {
      type: Number,
      required: true,
    },
    notes: {
      type: String,
      default: "",
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying by trainer and date
TrainerBookingSchema.index({ trainer: 1, date: 1 });
TrainerBookingSchema.index({ member: 1, date: 1 });

module.exports = mongoose.model("trainer_bookings", TrainerBookingSchema);



