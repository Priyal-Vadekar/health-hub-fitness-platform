const Payment = require("../models/Payment");
const UserMembership = require("../models/UserMembership");

exports.submitBankTransfer = async (req, res) => {
  try {
    const { membershipPlanId, withPersonalTrainer, referenceNumber, note } = req.body;
    const userId = req.user.id;

    const membershipPlan = await require("../models/MembershipPlan").findById(membershipPlanId);
    if (!membershipPlan) return res.status(404).json({ message: "Membership plan not found" });

    // Calculate price
    let calculatedPrice = membershipPlan.price;
    if (withPersonalTrainer && membershipPlan.personalTrainerCharge) {
      calculatedPrice += membershipPlan.personalTrainerCharge;
    }
    if (membershipPlan.discount) {
      const discountStr = membershipPlan.discount.toString().trim();
      const hasPercent = discountStr.includes('%');
      const numericValue = parseFloat(discountStr.replace(/[^0-9.]/g, ''));
      if (!isNaN(numericValue)) {
        if (hasPercent || numericValue <= 100) {
          calculatedPrice = calculatedPrice * (1 - numericValue / 100);
        } else {
          calculatedPrice = Math.max(0, calculatedPrice - numericValue);
        }
      }
    }
    calculatedPrice = Math.round(calculatedPrice * 100) / 100;

    const payment = await Payment.create({
      user: userId,
      gateway: 'manual',
      method: 'bank_transfer',
      amount: calculatedPrice,
      currency: (process.env.CURRENCY || 'INR').toUpperCase(),
      paymentMethod: 'Bank Transfer',
      transactionId: referenceNumber || `manual-${Date.now()}`,
      providerId: referenceNumber || null,
      status: 'Pending',
      metadata: { note, membershipPlanId, withPersonalTrainer }
    });

    res.status(201).json({ success: true, payment });
  } catch (error) {
    console.error("Bank transfer submission error:", error);
    res.status(500).json({ message: "Failed to submit bank transfer", error: error.message });
  }
};



