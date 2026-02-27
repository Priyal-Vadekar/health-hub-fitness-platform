// backend/controllers/paymentController.js
const Payment = require("../models/Payment");
const UserMembership = require("../models/UserMembership");

exports.processPayment = async (req, res) => {
    try {
        const { membershipId, amount, paymentMethod, transactionId } = req.body;

        const userMembership = await UserMembership.findById(membershipId);
        if (!userMembership) return res.status(404).json({ message: "Membership not found" });

        const newPayment = new Payment({
            userMembership: membershipId,
            amount,
            paymentMethod,
            transactionId,
            status: "Completed"
        });

        await newPayment.save();

        // Activate membership after successful payment
        userMembership.isActive = true;
        await userMembership.save();

        res.status(201).json({ message: "Payment successful. Membership activated.", payment: newPayment });
    } catch (error) {
        res.status(500).json({ message: "Payment processing failed", error: error.message });
    }
};

// CREATE payment
exports.createPayment = async (req, res) => {
    try {
        const { userMembership, amount, paymentMethod, transactionId, status } = req.body;

        const existingMembership = await UserMembership.findById(userMembership);
        if (!existingMembership) {
            return res.status(404).json({ message: "User membership not found" });
        }

        const payment = new Payment({
            userMembership,
            amount,
            paymentMethod,
            transactionId,
            status: status || "Completed"
        });

        await payment.save();

        if (status === "Completed") {
            existingMembership.isActive = true;
            await existingMembership.save();
        }

        res.status(201).json({ message: "Payment created", payment });
    } catch (error) {
        res.status(500).json({ message: "Failed to create payment", error: error.message });
    }
};

// READ all payments
exports.getAllPayments = async (req, res) => {
    try {
        const payments = await Payment.find()
            .populate({
                path: "userMembership",
                populate: {
                    path: "user",
                    select: "name email"
                }
            });
        res.status(200).json({ success: true, data: payments, });
    } catch (error) {
        res.status(500).json({ success: false,
        message: "Error fetching payments",
        error: error.message,});
    }
};

// READ single payment by ID
exports.getPaymentById = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id)
            .populate({
                path: "userMembership",
                populate: {
                    path: "user",
                    select: "name email"
                }
            });
        if (!payment) return res.status(404).json({ message: "Payment not found" });
        res.status(200).json({ payment });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch payment", error: error.message });
    }
};

// UPDATE payment by ID
exports.updatePayment = async (req, res) => {
    try {
        const updated = await Payment.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!updated) return res.status(404).json({ message: "Payment not found" });
        res.status(200).json({ message: "Payment updated", payment: updated });
    } catch (error) {
        res.status(500).json({ message: "Failed to update payment", error: error.message });
    }
};

// DELETE payment by ID
exports.deletePayment = async (req, res) => {
    try {
        const deleted = await Payment.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Payment not found" });
        res.status(200).json({ message: "Payment deleted" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete payment", error: error.message });
    }
};

// Revenue Report: total revenue per month
exports.getRevenueReport = async (req, res) => {
  try {
    const revenue = await require('../models/Payment').aggregate([
      { $match: { status: "Completed" } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$paymentDate" } },
          total: { $sum: "$amount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    res.json({ success: true, data: revenue });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error generating revenue report', error: err.message });
  }
};

// Outstanding Payments Report
exports.getOutstandingPayments = async (req, res) => {
  try {
    const outstanding = await require('../models/Payment').find({ status: "Pending" })
      .populate({
        path: "userMembership",
        populate: {
          path: "user",
          select: "name email"
        }
      });
    res.json({ success: true, data: outstanding });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching outstanding payments', error: err.message });
    }
};
