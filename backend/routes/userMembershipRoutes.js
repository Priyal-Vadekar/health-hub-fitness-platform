const express = require("express");
const router = express.Router();
const {
    createUserMembership,
    createMultipleUserMemberships,
    getAllUserMemberships,
    getUserMembershipById,
    updateUserMembership,
    deleteUserMembership,
    getMyMembership,
    getMembershipHistory,
    cancelAutoRenew,
    getCurrentMembership
} = require("../controllers/userMembershipController");
const { authenticateUser } = require("../middleware/authMiddleware");

// Member-specific routes (must come before parameterized routes)
router.get("/current", authenticateUser, getCurrentMembership);
router.get("/my-membership", authenticateUser, getMyMembership);
router.get("/history", authenticateUser, getMembershipHistory);
router.patch("/:id/cancel-auto-renew", authenticateUser, cancelAutoRenew);

// Routes
router.post("/create", createUserMembership);
router.post("/multiple", createMultipleUserMemberships);
router.get("/", getAllUserMemberships);
router.get("/:id", getUserMembershipById);
router.put("/update-user-membership/:id", updateUserMembership);
router.delete("/delete-user-membership/:id", deleteUserMembership);


module.exports = router;
