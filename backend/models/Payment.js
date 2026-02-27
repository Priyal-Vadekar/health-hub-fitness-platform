// backend/models/Payment.js
const mongoose = require("mongoose");

// Nested schema for Stripe-specific data
const StripeInfoSchema = new mongoose.Schema(
  {
    paymentIntentId: {
      type: String,
      default: null,
      index: true,
    },
    checkoutSessionId: {
      type: String,
      default: null,
      index: true,
    },
    customerId: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

// Nested schema for Razorpay-specific data
const RazorpayInfoSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      default: null,
      index: true,
    },
    paymentId: {
      type: String,
      default: null,
      index: true,
    },
    signature: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

// Common provider / transaction info
const ProviderInfoSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String, // gateway payment id / txn id
      default: null,
      index: true,
    },
    providerId: {
      type: String, // generic: session id / order id etc
      default: null,
      index: true,
    },
    stripe: {
      type: StripeInfoSchema,
      default: null,
    },
    razorpay: {
      type: RazorpayInfoSchema,
      default: null,
    },
  },
  { _id: false }
);

const PaymentSchema = new mongoose.Schema(
  {
    // Who paid
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    // For which membership / subscription (optional - created after payment succeeds)
    userMembership: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user_memberships",
      required: false, // Made optional - will be set after payment succeeds
      default: null,
      index: true,
    },
    // Gateway
    gateway: {
      type: String,
      enum: ["stripe", "paypal", "manual", "razorpay"],
      default: "stripe",
      required: true,
      index: true,
    },
    // Raw method from gateway (card / upi / netbanking)
    method: {
      type: String,
      default: null,
    },
    // Friendly method label for UI
    paymentMethod: {
      type: String,
      enum: ["Credit Card", "PayPal", "Bank Transfer", "Cash", "Stripe", "Razorpay"],
      required: true,
    },
    // Amount info
    amount: {
        type: Number,
      required: true,
      min: 0,
    },
    currency: {
        type: String,
      default: "INR",
      uppercase: true,
    },
    // Provider-specific nested info
    provider: {
      type: ProviderInfoSchema,
      default: {},
    },
    // Status
    status: {
        type: String,
      enum: ["Pending", "Completed", "Failed", "Refunded", "Canceled"],
      default: "Pending",
      index: true,
    },
    paymentDate: {
        type: Date,
      default: Date.now,
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    }
);

module.exports = mongoose.model("payments", PaymentSchema);
