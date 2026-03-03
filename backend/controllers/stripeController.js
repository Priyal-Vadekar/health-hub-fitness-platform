// backend/controllers/stripeController.js
const stripe = require("../config/stripe");
const UserMembership = require("../models/UserMembership");
const MembershipPlan = require("../models/MembershipPlan");
const TrainerBooking = require("../models/TrainerBooking");
const Payment = require("../models/Payment");
const User = require("../models/User");

/**
 * POST /api/stripe/create-checkout-session
 * Creates a Stripe session for MEMBERSHIP payment
 */
exports.createCheckoutSession = async (req, res) => {
  try {
    const { membershipPlanId, withPersonalTrainer } = req.body;
    const userId = req.user.id;

    if (!membershipPlanId) return res.status(400).json({ message: "membershipPlanId is required" });

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
    const amountInCents = Math.round(calculatedPrice * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "inr",
          product_data: {
            name: `${membershipPlan.title} - ${membershipPlan.plan}`,
            description: membershipPlan.description,
          },
          unit_amount: amountInCents,
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/payment-cancel?session_id={CHECKOUT_SESSION_ID}`,
      customer_email: user.email,
      metadata: {
        userId: userId,
        membershipPlanId: membershipPlan._id.toString(),
        withPersonalTrainer: withPersonalTrainer.toString(),
        type: "membership",
      },
    });

    await Payment.create({
      user: userId,
      gateway: "stripe",
      method: "card",
      amount: calculatedPrice,
      currency: "inr",
      paymentMethod: "Stripe",
      status: "Pending",
      provider: {
        providerId: session.id,
        transactionId: session.id,
        stripe: { checkoutSessionId: session.id, paymentIntentId: session.payment_intent || null, customerId: session.customer || null },
      },
      metadata: { membershipPlanId: membershipPlan._id.toString(), withPersonalTrainer, type: "membership" },
    });

    res.status(200).json({ success: true, sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Stripe createCheckoutSession error:", error);
    res.status(500).json({ message: "Failed to create checkout session", error: error.message });
  }
};

/**
 * POST /api/stripe/create-trainer-session
 * Creates a Stripe Checkout session for TRAINER SESSION payment
 * Body: { bookingId, amount }
 * After payment, Stripe redirects to /trainer-booking-success?session_id=...
 * and the frontend calls POST /api/bookings/confirm
 */
exports.createTrainerCheckoutSession = async (req, res) => {
  try {
    const { bookingId, amount } = req.body;
    const userId = req.user.id;

    if (!bookingId || !amount) {
      return res.status(400).json({ success: false, message: "bookingId and amount are required" });
    }

    // Verify booking
    const booking = await TrainerBooking.findById(bookingId)
      .populate("trainer", "name email")
      .populate("member", "name email");

    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
    if (booking.member._id.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Not authorized for this booking" });
    }
    if (booking.status !== "pending") {
      return res.status(400).json({ success: false, message: "Booking is not pending" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const amountInCents = Math.round(parseFloat(amount) * 100);
    const formattedDate = new Date(booking.date).toLocaleDateString("en-IN");

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "inr",
          product_data: {
            name: `Trainer Session - ${booking.trainer?.name || "Trainer"}`,
            description: `Date: ${formattedDate} | Time: ${booking.timeSlot?.start} - ${booking.timeSlot?.end}`,
          },
          unit_amount: amountInCents,
        },
        quantity: 1,
      }],
      mode: "payment",
      // Redirect to trainer success page with session_id so frontend can confirm booking
      success_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/trainer-booking-success?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
      cancel_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/member-dashboard`,
      customer_email: user.email,
      metadata: {
        userId: userId,
        bookingId: bookingId.toString(),
        type: "trainer_session",
        trainerName: booking.trainer?.name || "",
      },
    });

    // Save pending payment record
    const payment = await Payment.create({
      user: userId,
      gateway: "stripe",
      method: "card",
      amount: parseFloat(amount),
      currency: "inr",
      paymentMethod: "Stripe",
      status: "Pending",
      provider: {
        providerId: session.id,
        transactionId: session.id,
        stripe: { checkoutSessionId: session.id, paymentIntentId: null, customerId: null },
      },
      metadata: { bookingId: bookingId.toString(), type: "trainer_session" },
    });

    // Pre-link payment to booking
    booking.payment = payment._id;
    await booking.save();

    res.status(200).json({ success: true, sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Stripe createTrainerSession error:", error);
    res.status(500).json({ success: false, message: "Failed to create Stripe session", error: error.message });
  }
};

/**
 * GET /api/stripe/verify-payment/:sessionId
 * Verify payment status (used by frontend after redirect)
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) return res.status(400).json({ message: "sessionId is required" });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      const payment = await Payment.findOne({ "provider.stripe.checkoutSessionId": sessionId });

      if (payment && payment.status === "Pending") {
        const meta = payment.metadata || {};

        if (meta.type === "trainer_session" && meta.bookingId) {
          // Confirm trainer booking
          const booking = await TrainerBooking.findById(meta.bookingId);
          if (booking && booking.status === "pending") {
            booking.status = "confirmed";
            booking.payment = payment._id;
            await booking.save();
          }
          payment.status = "Completed";
          payment.provider.transactionId = session.payment_intent || payment.provider.transactionId;
          payment.provider.stripe.paymentIntentId = session.payment_intent || null;
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
          payment.provider.transactionId = session.payment_intent || payment.provider.transactionId;
          payment.provider.stripe.paymentIntentId = session.payment_intent || null;
          payment.paymentDate = new Date();
          await payment.save();
        }
      }

      return res.status(200).json({ success: true, paid: true, payment });
    }

    res.status(200).json({ success: true, paid: false, paymentStatus: session.payment_status });
  } catch (error) {
    console.error("Stripe verifyPayment error:", error);
    res.status(500).json({ message: "Failed to verify payment", error: error.message });
  }
};

/**
 * POST /api/stripe/webhook
 * Stripe Webhook Handler
 */
exports.handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const payment = await Payment.findOne({ "provider.stripe.checkoutSessionId": session.id });

        if (payment && payment.status === "Pending") {
          const meta = payment.metadata || {};

          if (meta.type === "trainer_session" && meta.bookingId) {
            const booking = await TrainerBooking.findById(meta.bookingId);
            if (booking && booking.status === "pending") {
              booking.status = "confirmed";
              booking.payment = payment._id;
              await booking.save();
            }
          } else if (meta.membershipPlanId) {
            const withPersonalTrainer = meta.withPersonalTrainer === "true" || meta.withPersonalTrainer === true;
            const userMembership = await UserMembership.create({
              user: payment.user,
              membershipPlan: meta.membershipPlanId,
              withPersonalTrainer,
              isActive: true,
            });
            payment.userMembership = userMembership._id;
          }

          payment.status = "Completed";
          payment.provider.transactionId = session.payment_intent || payment.provider.transactionId;
          payment.provider.stripe.paymentIntentId = session.payment_intent || null;
          payment.provider.stripe.customerId = session.customer || null;
          payment.paymentDate = new Date();
          await payment.save();
        }
        break;
      }
      default:
        break;
    }
    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing error:", error);
    res.status(500).json({ message: "Webhook processing failed" });
  }
};