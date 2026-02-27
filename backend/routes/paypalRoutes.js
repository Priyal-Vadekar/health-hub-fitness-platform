const express = require("express");
const { authenticateUser } = require("../middleware/authMiddleware");
const { createOrder, captureOrder } = require("../controllers/paypalController");

const router = express.Router();

router.post('/create-order', authenticateUser, createOrder);
router.post('/capture-order', authenticateUser, captureOrder);

module.exports = router;




