// backend/controllers/razorpayController.js
// Razorpay Payment Controller (Test Mode Only)
const crypto = require("crypto");
const razorpay = require("../config/razorpay");
const UserMembership = require("../models/UserMembership");
const MembershipPlan = require("../models/MembershipPlan");
const TrainerBooking = require("../models/TrainerBooking");
const Payment = require("../models/Payment");
const User = require("../models/User");

/**
 * POST /api/razorpay/create-order
 * Creates a Razorpay order for MEMBERSHIP payment
 */
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { membershipPlanId, withPersonalTrainer } = req.body;
    const userId = req.user.id;

    if (!membershipPlanId) {
      return res.status(400).json({ message: "membershipPlanId is required" });
    }

    const membershipPlan = await MembershipPlan.findById(membershipPlanId);
    if (!membershipPlan) return res.status(404).json({ message: "Membership plan not found" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    let calculatedPrice = membershipPlan.price;
    if (withPersonalTrainer && membershipPlan.personalTrainerCharge) {
      calculatedPrice += membershipPlan.personalTrainerCharge;
    }
    if (membershipPlan.discount) {
      const discountStr = membershipPlan.discount.toString().trim();
      const hasPercent = discountStr.includes("%");
      const numericValue = parseFloat(discountStr.replace(/[^0-9.]/g, ""));
      if (!isNaN(numericValue)) {
        if (hasPercent || numericValue <= 100) {
          calculatedPrice = calculatedPrice * (1 - numericValue / 100);
        } else {
          calculatedPrice = Math.max(0, calculatedPrice - numericValue);
        }
      }
    }
    calculatedPrice = Math.round(calculatedPrice * 100) / 100;
    const amountInPaise = Math.round(calculatedPrice * 100);
    const currency = process.env.RAZORPAY_CURRENCY || "INR";
    const shortReceipt = `rcpt_${Date.now()}`;

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency,
      receipt: shortReceipt,
      notes: {
        userId: userId.toString(),
        membershipPlanId: membershipPlan._id.toString(),
        membershipTitle: membershipPlan.title,
        withPersonalTrainer: withPersonalTrainer.toString(),
      },
    });

    await Payment.create({
      user: userId,
      gateway: "razorpay",
      method: "razorpay",
      amount: calculatedPrice,
      currency,
      paymentMethod: "Razorpay",
      status: "Pending",
      provider: {
        providerId: order.id,
        transactionId: order.id,
        razorpay: { orderId: order.id },
      },
      metadata: {
        membershipPlanId: membershipPlan._id.toString(),
        withPersonalTrainer,
        receipt: shortReceipt,
      },
    });

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: amountInPaise,
      currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      membership: {
        title: membershipPlan.title,
        duration: membershipPlan.duration,
        totalPrice: calculatedPrice,
      },
    });
  } catch (error) {
    console.error("Razorpay createOrder error:", error);
    res.status(500).json({ message: "Failed to create Razorpay order", error: error.message });
  }
};

/**
 * POST /api/razorpay/create-trainer-order
 * Creates a Razorpay order for TRAINER SESSION payment
 * Body: { bookingId, amount }
 * After payment, frontend calls POST /api/bookings/confirm with { bookingId, paymentId }
 */
exports.createTrainerOrder = async (req, res) => {
  try {
    const { bookingId, amount } = req.body;
    const userId = req.user.id;

    if (!bookingId || !amount) {
      return res.status(400).json({ success: false, message: "bookingId and amount are required" });
    }

    // Verify booking belongs to this member and is still pending
    const booking = await TrainerBooking.findById(bookingId)
      .populate("trainer", "name email")
      .populate("member", "name email");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    if (booking.member._id.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Not authorized for this booking" });
    }
    if (booking.status !== "pending") {
      return res.status(400).json({ success: false, message: "Booking is not pending" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Amount in paise
    const amountInPaise = Math.round(parseFloat(amount) * 100);
    const currency = process.env.RAZORPAY_CURRENCY || "INR";
    const shortReceipt = `ts_${Date.now()}`; // ts = trainer session

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency,
      receipt: shortReceipt,
      notes: {
        userId: userId.toString(),
        bookingId: bookingId.toString(),
        trainerName: booking.trainer?.name || "",
        type: "trainer_session",
      },
    });

    // Save pending payment record linked to this booking
    const payment = await Payment.create({
      user: userId,
      gateway: "razorpay",
      method: "razorpay",
      amount: parseFloat(amount),
      currency,
      paymentMethod: "Razorpay",
      status: "Pending",
      provider: {
        providerId: order.id,
        transactionId: order.id,
        razorpay: { orderId: order.id },
      },
      metadata: {
        bookingId: bookingId.toString(),
        type: "trainer_session",
        receipt: shortReceipt,
      },
    });

    // Link payment record to booking (optional pre-link)
    booking.payment = payment._id;
    await booking.save();

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: amountInPaise,
      currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Razorpay createTrainerOrder error:", error);
    res.status(500).json({ success: false, message: "Failed to create Razorpay order", error: error.message });
  }
};

/**
 * POST /api/razorpay/webhook
 * Handles Razorpay webhook events
 */
exports.handleRazorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature) return res.status(400).json({ message: "Missing signature header" });
    if (!secret) return res.status(500).json({ message: "Webhook secret not configured" });

    const rawBody = req.body.toString("utf8");
    const generatedSignature = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

    if (generatedSignature !== signature) {
      console.error("Razorpay webhook: Invalid signature");
      return res.status(400).json({ message: "Invalid signature" });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;

    if (event === "payment.captured") {
      const paymentEntity = payload.payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;
      const razorpayPaymentId = paymentEntity.id;

      const payment = await Payment.findOne({ "provider.razorpay.orderId": razorpayOrderId });
      if (payment && payment.status === "Pending") {
        const meta = payment.metadata || {};

        if (meta.type === "trainer_session" && meta.bookingId) {
          // Confirm the trainer booking
          const booking = await TrainerBooking.findById(meta.bookingId);
          if (booking && booking.status === "pending") {
            booking.status = "confirmed";
            booking.payment = payment._id;
            await booking.save();
          }
          payment.status = "Completed";
          payment.provider.transactionId = razorpayPaymentId;
          payment.provider.razorpay.paymentId = razorpayPaymentId;
          payment.paymentDate = new Date();
          await payment.save();
        } else if (meta.membershipPlanId) {
          // Membership payment
          const withPersonalTrainer = meta.withPersonalTrainer === "true" || meta.withPersonalTrainer === true;
          const userMembership = await UserMembership.create({
            user: payment.user,
            membershipPlan: meta.membershipPlanId,
            withPersonalTrainer,
            isActive: true,
          });
          payment.userMembership = userMembership._id;
          payment.status = "Completed";
          payment.provider.transactionId = razorpayPaymentId;
          payment.provider.razorpay.paymentId = razorpayPaymentId;
          payment.paymentDate = new Date();
          await payment.save();
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    res.status(500).json({ message: "Webhook processing failed", error: error.message });
  }
};

/**
 * POST /api/razorpay/verify-payment
 * Manual verification (optional fallback)
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const generated = crypto
      .createHmac("sha256", secret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (generated !== razorpaySignature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    const payment = await Payment.findOne({ "provider.razorpay.orderId": razorpayOrderId });
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });

    res.status(200).json({ success: true, paid: payment.status === "Completed", payment });
  } catch (error) {
    res.status(500).json({ success: false, message: "Verification failed", error: error.message });
  }
};