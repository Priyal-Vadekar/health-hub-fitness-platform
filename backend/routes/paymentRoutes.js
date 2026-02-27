// backend/routes/paymentRoutes.js
const express = require("express");
const {
    processPayment,
     createPayment,
     getAllPayments,
     getPaymentById,
     updatePayment,
     deletePayment,
     getRevenueReport,
     getOutstandingPayments
} = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Report routes must come before parameterized routes
router.get('/report/revenue', getRevenueReport);
router.get('/report/outstanding', getOutstandingPayments);

// CRUD routes
router.post("/new-payment", createPayment);
router.get("/all-payments", getAllPayments);
router.get("/payment/:id", getPaymentById);
router.put("/update-payment/:id", updatePayment);
router.delete("/delete-payment/:id", deletePayment);

module.exports = router;
