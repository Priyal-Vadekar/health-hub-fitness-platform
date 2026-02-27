// backend/routes/dosDontsRoutes.js
const express = require("express");
const {
  getDosDonts,
  updateDosDonts,
} = require("../controllers/dosDontsController");
const { authenticateUser } = require("../middleware/authMiddleware");

const router = express.Router();

// All routes require authentication
router.use(authenticateUser);

// Get Do's & Don'ts for a user
router.get("/:userId", getDosDonts);

// Create or update Do's & Don'ts for a user
router.post("/:userId", updateDosDonts);
router.put("/:userId", updateDosDonts);

module.exports = router;



