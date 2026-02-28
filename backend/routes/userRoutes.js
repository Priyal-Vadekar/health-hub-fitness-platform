// // routes/userRoutes.js
// const express = require("express");
// const router = express.Router();
// const {
//     getAllUsers,
//     getUserById,
//     createUser,
//     updateUserRole,
//     updateCertification,
//     assignDietitian,
//     assignTrainer,
//     deleteUser,
//     getMembershipGrowth,
//     getDashboardCounts
// } = require("../controllers/userController");

// // Report routes must come before parameterized routes
// router.get('/report/membership-growth', getMembershipGrowth);
// router.get('/report/dashboard-counts', getDashboardCounts);

// // CRUD routes
// router.get("/", getAllUsers);
// router.get("/:id", getUserById);
// router.post("/", createUser);
// router.put("/update-role/:id", updateUserRole);
// router.put("/update-certification/:id", updateCertification);
// router.put("/:memberId/assign-dietitian", assignDietitian);
// router.put("/:memberId/assign-trainer", assignTrainer);
// router.delete("/:id", deleteUser);

// module.exports = router;

// router.put("/:memberId/assign-dietitian", assignDietitian);
// router.put("/:memberId/assign-trainer", assignTrainer);
// router.delete("/:id", deleteUser);

// module.exports = router;

// backend/routes/userRoutes.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const {
    getAllUsers,
    getUserById,
    createUser,
    updateUserRole,
    updateCertification,
    assignDietitian,
    assignTrainer,
    deleteUser,
    getMembershipGrowth,
    getDashboardCounts
} = require("../controllers/userController");

// PUBLIC ROUTE — no auth required
// Must be defined BEFORE any middleware-protected routes
// Used by Home.js and About.js stat cards
router.get("/public-stats", async (req, res) => {
    try {
        const [members, staff, dietitians] = await Promise.all([
            User.countDocuments({ role: "Member" }),
            User.countDocuments({ role: { $in: ["Staff", "Trainer"] } }),
            User.countDocuments({ role: { $in: ["RD", "RDN"] } }),
        ]);

        res.status(200).json({ members, staff, dietitians });
    } catch (error) {
        console.error("Public stats error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Report routes — must come before /:id to avoid route conflicts
router.get("/report/membership-growth", getMembershipGrowth);
router.get("/report/dashboard-counts", getDashboardCounts);

// CRUD routes
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.post("/", createUser);
router.put("/update-role/:id", updateUserRole);
router.put("/update-certification/:id", updateCertification);
router.put("/:memberId/assign-dietitian", assignDietitian);
router.put("/:memberId/assign-trainer", assignTrainer);
router.delete("/:id", deleteUser);

module.exports = router;