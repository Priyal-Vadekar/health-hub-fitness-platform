const express = require("express");
const { authenticateUser } = require("../middleware/authMiddleware");
const { submitBankTransfer } = require("../controllers/bankTransferController");

const router = express.Router();

router.post('/submit', authenticateUser, submitBankTransfer);

module.exports = router;




