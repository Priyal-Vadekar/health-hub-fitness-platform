// backend/controllers/razorpayController.js
// Razorpay Payment Controller (Test Mode Only)
const crypto = require("crypto");
const razorpay = require("../config/razorpay");
const UserMembership = require("../models/UserMembership");
const MembershipPlan = require("../models/MembershipPlan");
const Payment = require("../models/Payment");
const User = require("../models/User");

/**
 * POST /api/razorpay/create-order
 * Creates a Razorpay order for membership payment
 */
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { membershipPlanId, withPersonalTrainer } = req.body;
    const userId = req.user.id;

    if (!membershipPlanId) {
      return res.status(400).json({ message: "membershipPlanId is required" });
    }

    // Find membership plan
    const membershipPlan = await MembershipPlan.findById(membershipPlanId);
    if (!membershipPlan) {
      return res.status(404).json({ message: "Membership plan not found" });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Calculate price
    let calculatedPrice = membershipPlan.price;
    
    // Add personal trainer charge if selected
    if (withPersonalTrainer && membershipPlan.personalTrainerCharge) {
      calculatedPrice += membershipPlan.personalTrainerCharge;
    }
    
    // Apply discount
    if (membershipPlan.discount) {
      const discountStr = membershipPlan.discount.toString().trim();
      const hasPercent = discountStr.includes('%');
      const numericValue = parseFloat(discountStr.replace(/[^0-9.]/g, ''));
      
      if (!isNaN(numericValue)) {
        if (hasPercent) {
          calculatedPrice = calculatedPrice * (1 - numericValue / 100);
        } else if (numericValue <= 100) {
          calculatedPrice = calculatedPrice * (1 - numericValue / 100);
        } else {
          calculatedPrice = Math.max(0, calculatedPrice - numericValue);
        }
      }
    }
    
    calculatedPrice = Math.round(calculatedPrice * 100) / 100;

    // Calculate amount in paise (₹3420 => 342000 paise)
    // Razorpay requires amount in smallest currency unit (paise for INR)
    const amountInPaise = Math.round(calculatedPrice * 100);
    const currency = process.env.RAZORPAY_CURRENCY || "INR";

    // Create Razorpay order
    // Note: receipt must be ≤ 40 characters
    const shortReceipt = `rcpt_${Date.now()}`;
    
    const order = await razorpay.orders.create({
      amount: amountInPaise, // Amount in paise
      currency,
      receipt: shortReceipt, // Keep it short (≤ 40 chars)
      notes: {
        userId: userId.toString(),
        membershipPlanId: membershipPlan._id.toString(),
        membershipTitle: membershipPlan.title,
        withPersonalTrainer: withPersonalTrainer.toString(),
      },
    });


    // Save pending payment record in MongoDB (without userMembership yet)
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
        razorpay: {
          orderId: order.id,
        },
      },
      metadata: {
        membershipPlanId: membershipPlan._id.toString(),
        withPersonalTrainer,
        receipt: shortReceipt
      },
    });

    // Return order details to frontend
    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: amountInPaise,
      currency,
      keyId: process.env.RAZORPAY_KEY_ID, // Safe to send key_id to frontend
      membership: {
        title: membershipPlan.title,
        duration: membershipPlan.duration,
        totalPrice: calculatedPrice,
      },
    });
  } catch (error) {
    console.error("Razorpay createOrder error:", error);
    res.status(500).json({ 
      message: "Failed to create Razorpay order", 
      error: error.message 
    });
  }
};

/**
 * POST /api/razorpay/webhook
 * Handles Razorpay webhook events
 * Verifies signature and updates payment status
 */
exports.handleRazorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature) {
      return res.status(400).json({ message: "Missing signature header" });
    }

    if (!secret) {
      return res.status(500).json({ message: "Webhook secret not configured" });
    }

    // req.body is a Buffer when using express.raw()
    // Convert to string for signature verification
    const rawBody = req.body.toString('utf8');

    // Verify signature using HMAC SHA256
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (generatedSignature !== signature) {
      console.error("Razorpay webhook: Invalid signature");
      return res.status(400).json({ message: "Invalid signature" });
    }

    // Parse body as JSON for processing
    const payload = JSON.parse(rawBody);
    const event = payload.event;


    // Handle payment.captured event
    if (event === "payment.captured") {
      const paymentEntity = payload.payload.payment.entity;
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;

      // Find payment record by Razorpay order ID
      const payment = await Payment.findOne({ "provider.razorpay.orderId": orderId });

      if (payment && payment.status === "Pending") {
        // Create UserMembership NOW (after successful payment)
        const membershipPlanId = payment.metadata.membershipPlanId;
        const withPersonalTrainer = payment.metadata.withPersonalTrainer === 'true' || payment.metadata.withPersonalTrainer === true;

        const userMembership = await UserMembership.create({
          user: payment.user,
          membershipPlan: membershipPlanId,
          withPersonalTrainer,
          isActive: true, // Activate immediately since payment succeeded
        });

          // Update payment
          payment.userMembership = userMembership._id;
          payment.status = "Completed";
          payment.provider.transactionId = paymentId;
          payment.provider.razorpay.paymentId = paymentId;
          payment.provider.razorpay.signature = paymentEntity.notes?.signature || null;
          payment.paymentDate = new Date();
          payment.metadata = {
            ...payment.metadata,
            paymentEntity,
            capturedAt: new Date().toISOString()
          };
          await payment.save();
      }
    } 
    // Handle payment.failed event
    else if (event === "payment.failed") {
      const paymentEntity = payload.payload.payment.entity;
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;

      await Payment.findOneAndUpdate(
        { "provider.razorpay.orderId": orderId },
        {
          status: "Failed",
          "provider.razorpay.paymentId": paymentId,
          metadata: { 
            paymentEntity,
            failedAt: new Date().toISOString()
          }
        }
      );
    }
    // Handle order.paid event (backup)
    else if (event === "order.paid") {
      const orderEntity = payload.payload.order.entity;
      const orderId = orderEntity.id;

      const payment = await Payment.findOne({ "provider.razorpay.orderId": orderId });

      if (payment && !payment.userMembership) {
        // Create UserMembership (backup handler)
        const membershipPlanId = payment.metadata.membershipPlanId;
        const withPersonalTrainer = payment.metadata.withPersonalTrainer === 'true' || payment.metadata.withPersonalTrainer === true;

        const userMembership = await UserMembership.create({
          user: payment.user,
          membershipPlan: membershipPlanId,
          withPersonalTrainer,
          isActive: true,
        });

        payment.userMembership = userMembership._id;
        payment.status = "Completed";
        payment.paymentDate = new Date();
        await payment.save();
      }
    }

    // Respond to Razorpay
    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    res.status(500).json({ message: "Webhook processing error" });
  }
};

/**
 * POST /api/razorpay/verify-payment (Optional)
 * Manual verification endpoint for frontend
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment details" });
    }

    // Find payment first
    const payment = await Payment.findOne({
      "provider.razorpay.orderId": razorpay_order_id,
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    // Verify signature
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated_signature === razorpay_signature) {
      // Create UserMembership if not exists
      if (!payment.userMembership) {
        const membershipPlanId = payment.metadata.membershipPlanId;
        const withPersonalTrainer = payment.metadata.withPersonalTrainer === 'true' || payment.metadata.withPersonalTrainer === true;

        const userMembership = await UserMembership.create({
          user: payment.user,
          membershipPlan: membershipPlanId,
          withPersonalTrainer,
          isActive: true,
        });

        payment.userMembership = userMembership._id;
      }

      // Update payment record
      payment.status = "Completed";
      payment.provider.transactionId = razorpay_payment_id;
      payment.provider.razorpay.paymentId = razorpay_payment_id;
      payment.provider.razorpay.signature = razorpay_signature;
      payment.paymentDate = new Date();
      await payment.save();

      return res.status(200).json({ success: true, verified: true });
    } else {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ message: "Verification failed", error: error.message });
  }
};

