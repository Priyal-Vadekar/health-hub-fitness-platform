const express = require("express");
const {
  getDietitians,
  updateUserRole,
  updateCertification,
  assignDietitian,
  assignTrainer,
  getDietitianAnalytics,
  assignTrainerToMembers,
  assignDietitianToMembers
} = require("../controllers/userController");
const { authenticateUser, isAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticateUser);
router.use(isAdmin);

router.get("/dietitians", getDietitians);
router.get("/dietitians/report", getDietitianAnalytics);
router.patch("/users/:id/role", updateUserRole);
router.patch("/users/:id/certification", updateCertification);
router.patch("/users/:memberId/assign-dietitian", assignDietitian);
router.patch("/users/:memberId/assign-trainer", assignTrainer);
router.patch("/trainers/:trainerId/assign-members", assignTrainerToMembers);
router.patch("/dietitians/:dietitianId/assign-members", assignDietitianToMembers);

module.exports = router;

