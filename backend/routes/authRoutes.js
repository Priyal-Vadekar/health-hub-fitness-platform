// backend/routes/authRoutes.js
const express = require("express");
const admin = require("firebase-admin");
const User = require("../models/User");

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
  changePassword,
  generateAccessToken,
} = require("../controllers/authController");

const { authenticateUser } = require("../middleware/authMiddleware");

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

    const decodedToken = await admin.auth().verifyIdToken(token);
    const { uid, name, email, picture } = decodedToken;

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        googleId: uid,
        name,
        email,
        profilePic: picture,
        isEmailVerified: true,
      });
      await user.save();
    } else if (!user.isEmailVerified) {
      user.isEmailVerified = true;
      await user.save();
    }

    // Use the imported generateAccessToken directly.
    // Token lifetime now matches email login (1h) instead of the 15m fallback.
    const jwtToken = generateAccessToken(user);

    // createRefreshToken (in authController) now revokes all existing
    // active tokens for this user before creating a new one, so Google logins
    // can't accumulate hundreds of refresh tokens.
    const crypto = require("crypto");
    const RefreshToken = require("../models/RefreshToken");

    // Revoke all existing active tokens for this user
    await RefreshToken.deleteMany({ user: user._id });

    const tokenStr = crypto.randomBytes(40).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await RefreshToken.create({ user: user._id, token: tokenStr, expiresAt });

    const isProd = process.env.NODE_ENV === "production";
    res.cookie("refreshToken", tokenStr, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.status(200).json({
      message: "Google login successful",
      token: jwtToken,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({ error: "Google login failed" });
  }
});

module.exports = router;