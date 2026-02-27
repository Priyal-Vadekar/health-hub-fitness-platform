const { client, paypal } = require("../config/paypal");
const Payment = require("../models/Payment");
const UserMembership = require("../models/UserMembership");

exports.createOrder = async (req, res) => {
  try {
    const { userMembershipId } = req.body;
    const userId = req.user.id;

    const membership = await UserMembership.findById(userMembershipId).populate("membershipPlan");
    if (!membership) return res.status(404).json({ message: "Membership not found" });
    if (membership.user.toString() !== userId) return res.status(403).json({ message: "Unauthorized" });

    const amount = membership.totalPrice;
    const currency = (process.env.CURRENCY).toUpperCase();

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: userMembershipId.toString(),
          description: `${membership.membershipPlan.title} - ${membership.membershipPlan.plan}`,
          amount: { currency_code: currency, value: amount.toFixed(2) },
        },
      ],
      application_context: {
        brand_name: "HealthHub",
        landing_page: "NO_PREFERENCE",
        user_action: "PAY_NOW",
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-cancel`,
      },
    });

    const response = await client().execute(request);

    // Create or update pending payment
    await Payment.findOneAndUpdate(
      { userMembership: userMembershipId, gateway: 'paypal', status: 'Pending' },
      {
        user: userId,
        userMembership: userMembershipId,
        gateway: 'paypal',
        method: 'paypal',
        amount,
        currency,
        paymentMethod: 'PayPal',
        transactionId: response.result.id,
        providerId: response.result.id,
        metadata: { links: response.result.links }
      },
      { upsert: true }
    );

    res.status(200).json({ id: response.result.id, links: response.result.links });
  } catch (error) {
    console.error("PayPal createOrder error:", error);
    res.status(500).json({ message: "Failed to create PayPal order", error: error.message });
  }
};

exports.captureOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    const capture = await client().execute(request);

    // Update payment
    const payment = await Payment.findOne({ providerId: orderId, gateway: 'paypal' });
    if (payment) {
      payment.status = 'Completed';
      payment.paymentDate = new Date();
      await payment.save();

      const membership = await UserMembership.findById(payment.userMembership);
      if (membership) {
        membership.isActive = true;
        await membership.save();
      }
    }

    res.status(200).json({ success: true, capture: capture.result });
  } catch (error) {
    console.error("PayPal captureOrder error:", error);
    res.status(500).json({ message: "Failed to capture PayPal order", error: error.message });
  }
};




