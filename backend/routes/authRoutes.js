// backend/routes/authRoutes.js
const jwt = require("jsonwebtoken"); 
const express = require("express");
const admin = require("firebase-admin"); // Firebase Admin SDK for token verification
const { 
  register, 
  login, 
  getCurrentUser, 
  verifyEmail, 
  resendVerificationEmail, 
  forgotPassword, 
  resetPassword,
  refreshToken,
  logout,
  changePassword
} = require("../controllers/authController");
const { authenticateUser } = require("../middleware/authMiddleware");

const User = require("../models/User");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticateUser, getCurrentUser);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);

// Email verification routes
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationEmail);

// Password reset routes
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.put("/change-password", authenticateUser, changePassword);

// Google Login Route
router.post("/google-login", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "No token provided" });
    }

    // console.log("Received Token:", token); // Debug: Check token value

    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    // console.log("Decoded Token:", decodedToken); // Debug: Check decoded data

    const { uid, name, email, picture } = decodedToken;
    let user = await User.findOne({ email });

    if (!user) {
      user = new User({ googleId: uid, name, email, profilePic: picture });
      await user.save();
    }

    // Issue access & refresh tokens
    const jwtToken = require("../controllers/authController").__proto__?.generateAccessToken
      ? require("../controllers/authController").generateAccessToken(user)
      : jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "15m" });

    // create refresh token and set cookie (reuse controller helpers via minimal inline logic)
    const crypto = require("crypto");
    const RefreshToken = require("../models/RefreshToken");
    const tokenStr = crypto.randomBytes(40).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await RefreshToken.create({ user: user._id, token: tokenStr, expiresAt });
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("refreshToken", tokenStr, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({ message: "Login successful", user, token: jwtToken });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/user-role", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ role: user.role });
  } catch (error) {
    console.error("Error fetching user role:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
