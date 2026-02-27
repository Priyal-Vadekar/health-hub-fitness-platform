// backend/middleware/dietitianMiddleware.js
const User = require("../models/User");

// Middleware to check if user is a Dietitian (RD or RDN)
const isDietitian = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || (user.role !== "RD" && user.role !== "RDN")) {
      return res
        .status(403)
        .json({ message: "Access denied. Dietitians only." });
    }
    req.dietitian = user;
    next();
  } catch (error) {
    res
      .status(500)
      .json({ message: "Authorization error", error: error.message });
  }
};

// Middleware to check if user is a Trainer
const isTrainer = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "Trainer") {
      return res
        .status(403)
        .json({ message: "Access denied. Trainers only." });
    }
    req.trainer = user;
    next();
  } catch (error) {
    res
      .status(500)
      .json({ message: "Authorization error", error: error.message });
  }
};

module.exports = { isDietitian, isTrainer };



