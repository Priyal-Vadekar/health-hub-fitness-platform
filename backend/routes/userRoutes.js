// routes/userRoutes.js
const express = require("express");
const router = express.Router();
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

// Report routes must come before parameterized routes
router.get('/report/membership-growth', getMembershipGrowth);
router.get('/report/dashboard-counts', getDashboardCounts);

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

router.put("/:memberId/assign-dietitian", assignDietitian);
router.put("/:memberId/assign-trainer", assignTrainer);
router.delete("/:id", deleteUser);

module.exports = router;
