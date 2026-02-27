const UserMembership = require("../models/UserMembership");
const MembershipPlan = require("../models/MembershipPlan");

// Create a new user membership
exports.createUserMembership = async (req, res) => {
  try {
    const { user, membershipPlan, withPersonalTrainer } = req.body;

    // Basic validation
    if (!user || !membershipPlan) {
      return res.status(400).json({ message: "User and Membership Plan are required." });
    }

    // Create document with required fields including withPersonalTrainer
    const newMembership = new UserMembership({ 
      user, 
      membershipPlan,
      withPersonalTrainer: withPersonalTrainer || false
    });

    // Save and trigger pre('validate') hook which calculates totalPrice
    const savedMembership = await newMembership.save();

    // Debug log to verify calculation
    console.log(`UserMembership created - ID: ${savedMembership._id}, Total Price: ₹${savedMembership.totalPrice}, With PT: ${savedMembership.withPersonalTrainer}`);

    res.status(201).json(savedMembership);
  } catch (error) {
    console.error("Error creating user membership:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get all user memberships
exports.getAllUserMemberships = async (req, res) => {
    try {
        const memberships = await UserMembership.find()
            .populate("user")
            .populate("membershipPlan");

        res.status(200).json(memberships);
    } catch (error) {
        console.error("Error fetching memberships:", error);
        res.status(500).json({ error: "Failed to fetch memberships" });
    }
};

// Get membership by ID
exports.getUserMembershipById = async (req, res) => {
    try {
        const membership = await UserMembership.findById(req.params.id)
            .populate("user")
            .populate("membershipPlan");

        if (!membership) {
            return res.status(404).json({ error: "Membership not found" });
        }

        res.status(200).json(membership);
    } catch (error) {
        console.error("Error fetching membership:", error);
        res.status(500).json({ error: "Failed to fetch membership" });
    }
};

// Update membership (e.g., admin toggles isActive or updates dates)
exports.updateUserMembership = async (req, res) => {
    try {
        const updatedMembership = await UserMembership.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!updatedMembership) {
            return res.status(404).json({ error: "Membership not found" });
        }

        res.status(200).json(updatedMembership);
    } catch (error) {
        console.error("Error updating membership:", error);
        res.status(500).json({ error: "Failed to update membership" });
    }
};

// Delete a membership
exports.deleteUserMembership = async (req, res) => {
    try {
        const deletedMembership = await UserMembership.findByIdAndDelete(req.params.id);

        if (!deletedMembership) {
            return res.status(404).json({ error: "Membership not found" });
        }

        res.status(200).json({ message: "Membership deleted successfully" });
    } catch (error) {
        console.error("Error deleting membership:", error);
        res.status(500).json({ error: "Failed to delete membership" });
    }
};

// Create multiple user memberships
exports.createMultipleUserMemberships = async (req, res) => {
  try {
    const memberships = req.body; // Expecting an array of memberships

    // Validate the array of memberships
    if (!Array.isArray(memberships) || memberships.length === 0) {
      return res.status(400).json({ message: "At least one membership is required." });
    }

    // Validate each membership object
    memberships.forEach((membership) => {
      const { user, membershipPlan } = membership;
      if (!user || !membershipPlan) {
        throw new Error("User and Membership Plan are required.");
      }
    });

    // Create documents for each membership in the array
    const newMemberships = memberships.map(({ user, membershipPlan }) => {
      return new UserMembership({ user, membershipPlan });
    });

    // Save all memberships at once using insertMany
    const savedMemberships = await UserMembership.insertMany(newMemberships);

    res.status(201).json(savedMemberships);
  } catch (error) {
    console.error("Error creating multiple user memberships:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get current user's active membership
exports.getMyMembership = async (req, res) => {
  try {
    const userId = req.user.id;
    const membership = await UserMembership.findOne({ user: userId, isActive: true })
      .populate("membershipPlan")
      .sort({ startDate: -1 });

    if (!membership) {
      return res.status(200).json({ success: true, data: null });
    }

    res.status(200).json({ success: true, data: membership });
  } catch (error) {
    console.error("Error fetching my membership:", error);
    res.status(500).json({ success: false, message: "Failed to fetch membership", error: error.message });
  }
};

// Get membership history for current user
exports.getMembershipHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const memberships = await UserMembership.find({ user: userId })
      .populate("membershipPlan")
      .sort({ startDate: -1 });

    res.status(200).json({ success: true, data: memberships });
  } catch (error) {
    console.error("Error fetching membership history:", error);
    res.status(500).json({ success: false, message: "Failed to fetch membership history", error: error.message });
  }
};

// Cancel auto-renewal (set a flag or update status)
exports.cancelAutoRenew = async (req, res) => {
  try {
    const userId = req.user.id;
    const membershipId = req.params.id;
    
    const membership = await UserMembership.findOne({ _id: membershipId, user: userId });
    if (!membership) {
      return res.status(404).json({ success: false, message: "Membership not found" });
    }

    membership.autoRenew = false;
    membership.cancelledAt = new Date();
    
    await membership.save();

    res.status(200).json({ success: true, message: "Auto-renewal cancelled. Your membership will remain active until the end date.", data: membership });
  } catch (error) {
    console.error("Error cancelling auto-renewal:", error);
    res.status(500).json({ success: false, message: "Failed to cancel auto-renewal", error: error.message });
  }
};

// Get current membership (alias for getMyMembership)
exports.getCurrentMembership = async (req, res) => {
  return exports.getMyMembership(req, res);
};
