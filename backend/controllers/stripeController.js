// backend/controllers/stripeController.js
const stripe = require("../config/stripe");
const UserMembership = require("../models/UserMembership");
const MembershipPlan = require("../models/MembershipPlan");
const Payment = require("../models/Payment");
const User = require("../models/User");

// Create Stripe Checkout Session
exports.createCheckoutSession = async (req, res) => {
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
    const amountInCents = Math.round(calculatedPrice * 100);

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: `${membershipPlan.title} - ${membershipPlan.plan}`,
              description: membershipPlan.description,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/payment-cancel?session_id={CHECKOUT_SESSION_ID}`,
      customer_email: user.email,
      metadata: {
        userId: userId,
        membershipPlanId: membershipPlan._id.toString(),
        withPersonalTrainer: withPersonalTrainer.toString(),
      },
    });

    // Create pending payment record (without userMembership yet)
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
        stripe: {
          checkoutSessionId: session.id,
          paymentIntentId: session.payment_intent || null,
          customerId: session.customer || null,
        },
      },
      metadata: {
        membershipPlanId: membershipPlan._id.toString(),
        withPersonalTrainer,
      }
    });

    res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Stripe Checkout Session Error:", error);
    res.status(500).json({
      message: "Failed to create checkout session",
      error: error.message,
    });
  }
};

// Verify payment status (for frontend polling)
exports.verifyPayment = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ message: "sessionId is required" });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
        // Find and update payment
        const payment = await Payment.findOne({
          "provider.stripe.checkoutSessionId": sessionId,
        });

        if (payment && payment.status === "Pending" && !payment.userMembership) {
          // Create UserMembership (payment verification endpoint)
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
          payment.provider.transactionId = session.payment_intent || payment.provider.transactionId;
          payment.provider.stripe.paymentIntentId = session.payment_intent || payment.provider.stripe.paymentIntentId;
          payment.paymentDate = new Date();
          await payment.save();
        }

      return res.status(200).json({
        success: true,
        paid: true,
        payment: payment,
      });
    }

    res.status(200).json({
      success: true,
      paid: false,
      paymentStatus: session.payment_status,
    });
  } catch (error) {
    console.error("Payment Verification Error:", error);
    res.status(500).json({
      message: "Failed to verify payment",
      error: error.message,
    });
  }
};

// Stripe Webhook Handler
exports.handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;

        // Find payment record by Stripe checkout session ID
        const payment = await Payment.findOne({
          "provider.stripe.checkoutSessionId": session.id,
        });

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

          // Update payment with userMembership reference
          payment.userMembership = userMembership._id;
          payment.status = "Completed";
          payment.provider.transactionId = session.payment_intent || payment.provider.transactionId;
          payment.provider.stripe.paymentIntentId = session.payment_intent || payment.provider.stripe.paymentIntentId;
          payment.provider.stripe.customerId = session.customer || payment.provider.stripe.customerId;
          payment.paymentDate = new Date();
          await payment.save();
        }
        break;
      }

      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object;
        const payment = await Payment.findOne({
          "provider.stripe.checkoutSessionId": session.id,
        });

        if (payment && !payment.userMembership) {
          // Create UserMembership (async payment succeeded)
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
          payment.provider.transactionId = session.payment_intent || payment.provider.transactionId;
          payment.provider.stripe.paymentIntentId = session.payment_intent || payment.provider.stripe.paymentIntentId;
          payment.paymentDate = new Date();
          await payment.save();
        }
        break;
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object;
        const payment = await Payment.findOne({
          "provider.stripe.checkoutSessionId": session.id,
        });

        if (payment) {
          payment.status = "Failed";
          await payment.save();
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        const payment = await Payment.findOne({
          "provider.stripe.paymentIntentId": paymentIntent.id,
        });

        if (payment && payment.status === "Pending") {
          payment.status = "Failed";
          await payment.save();
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;
        const paymentIntent = charge.payment_intent;

        const payment = await Payment.findOne({
          "provider.stripe.paymentIntentId": paymentIntent,
        });

        if (payment) {
          payment.status = "Refunded";
          await payment.save();

          // Deactivate membership on refund
          if (payment.userMembership) {
            const userMembership = await UserMembership.findById(payment.userMembership);
            if (userMembership) {
              userMembership.isActive = false;
              await userMembership.save();
            }
          }
        }
        break;
      }

      default:
        // Unhandled event type
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    res.status(500).json({ error: error.message });
  }
};


