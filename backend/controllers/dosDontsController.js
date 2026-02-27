// backend/controllers/dosDontsController.js
const DosDonts = require("../models/DosDonts");
const User = require("../models/User");

// Get Do's & Don'ts for a user
exports.getDosDonts = async (req, res) => {
  try {
    const { userId } = req.params;

    const dosDonts = await DosDonts.findOne({ user: userId });

    if (!dosDonts) {
      // Return empty structure if not found
      return res.status(200).json({
        success: true,
        data: { dos: [], donts: [] },
      });
    }

    res.status(200).json({
      success: true,
      data: dosDonts,
    });
  } catch (error) {
    console.error("Get dos donts error:", error);
    res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Create or update Do's & Don'ts
exports.updateDosDonts = async (req, res) => {
  try {
    const { userId } = req.params;
    const { dos, donts } = req.body;
    const createdBy = req.user.id;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify creator is Dietitian, Trainer, or Admin
    const creator = await User.findById(createdBy);
    if (!creator || !["RD", "RDN", "Trainer", "Admin"].includes(creator.role)) {
      return res.status(403).json({
        message:
          "Only Dietitians, Trainers, or Admins can set Do's & Don'ts",
      });
    }

    let dosDonts = await DosDonts.findOne({ user: userId });

    if (dosDonts) {
      // Update existing
      dosDonts.dos = dos || [];
      dosDonts.donts = donts || [];
      dosDonts.createdBy = createdBy;
      await dosDonts.save();
    } else {
      // Create new
      dosDonts = await DosDonts.create({
        user: userId,
        createdBy,
        dos: dos || [],
        donts: donts || [],
      });
    }

    res.status(200).json({
      success: true,
      message: "Do's & Don'ts updated",
      data: dosDonts,
    });
  } catch (error) {
    console.error("Update dos donts error:", error);
    res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};



