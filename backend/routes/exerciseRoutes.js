// backend/routes/exerciseRoutes.js
// Routes are still publicly readable (GET) but write operations now decode
// the token if present (via optionalAuth) so we can store/check ownership.
const express = require("express");
const router = express.Router();
const {
    getExercises,
    getExerciseById,
    createExercise,
    updateExercise,
    deleteExercise,
} = require("../controllers/exerciseController");
const jwt = require("jsonwebtoken");

// ── Optional auth middleware ──────────────────────────────────────────────────
// Decodes the Bearer token if present and attaches req.user.
// Does NOT block the request if no token — keeps GET routes fully public.
const optionalAuth = (req, res, next) => {
    try {
        const auth = req.headers.authorization;
        if (auth && auth.startsWith("Bearer ")) {
            const token = auth.split(" ")[1];
            req.user = jwt.verify(token, process.env.JWT_SECRET);
        }
    } catch (_) {
        // Invalid/expired token — ignore, proceed without req.user
    }
    next();
};

router.get("/", optionalAuth, getExercises);
router.get("/:id", optionalAuth, getExerciseById);
router.post("/new-exercise", optionalAuth, createExercise);
router.put("/update-exercise/:id", optionalAuth, updateExercise);
router.delete("/delete-exercise/:id", optionalAuth, deleteExercise);

module.exports = router;