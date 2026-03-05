// backend/controllers/authController.js
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../config/emailService");
const RefreshToken = require("../models/RefreshToken");

const generateAccessToken = (user) => {
    return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

const createRefreshToken = async (userId) => {
    await RefreshToken.updateMany(
        { user: userId, revokedAt: null },
        { $set: { revokedAt: new Date() } }
    );

    const token = crypto.randomBytes(40).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await RefreshToken.create({ user: userId, token, expiresAt });
    return token;
};

const setRefreshCookie = (res, token) => {
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("refreshToken", token, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: "/",
    });
};

const deleteRevokedToken = async (tokenStr) => {
    await RefreshToken.deleteOne({ token: tokenStr });
};

// Export generateAccessToken so authRoutes.js can import it directly
exports.generateAccessToken = generateAccessToken;

// REGISTER
exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const verificationCode = crypto.randomBytes(32).toString("hex").toUpperCase();

        const user = new User({
            name,
            email,
            password: hashedPassword,
            role: role || "Member",
            emailVerificationToken: verificationCode,
            emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
            isEmailVerified: false,
        });

        await user.save();
        await sendVerificationEmail(user.email, user.name, verificationCode);

        res.status(201).json({
            message: "Registration successful! Please check your email for the verification code.",
        });
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// LOGIN
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        if (!user.isEmailVerified) {
            return res.status(403).json({ message: "Please verify your email before logging in" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const accessToken = generateAccessToken(user);
        // createRefreshToken now revokes old tokens first (Bug 2 fix)
        const refreshTokenStr = await createRefreshToken(user._id);
        setRefreshCookie(res, refreshTokenStr);
        res.status(200).json({ message: "Login successful", user, token: accessToken });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// CURRENT USER
exports.getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

// VERIFY EMAIL
exports.verifyEmail = async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!code) return res.status(400).json({ message: "Verification code is required" });

        const user = await User.findOne({
            email,
            emailVerificationExpires: { $gt: Date.now() },
        });

        if (!user) return res.status(404).json({ message: "User not found or code expired" });

        if (user.emailVerificationToken !== code.toUpperCase()) {
            return res.status(400).json({
                message: "The code you entered is incorrect. Please try again or request a new code.",
            });
        }

        // Correct code --> verify email
        user.isEmailVerified = true;
        user.emailVerificationToken = null;
        user.emailVerificationExpires = null;
        await user.save();

        res.status(200).json({ message: "Email verified successfully! You can now log in." });
    } catch (error) {
        console.error("Email verification error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// RESEND VERIFICATION
exports.resendVerificationEmail = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.isEmailVerified) {
            return res.status(400).json({ message: "Email is already verified" });
        }

        // Use 32 bytes here too (was 3 bytes / 6 hex chars)
        const newCode = crypto.randomBytes(32).toString("hex").toUpperCase();
        user.emailVerificationToken = newCode;
        user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await user.save();

        await sendVerificationEmail(user.email, user.name, newCode);

        res.status(200).json({ message: "A new verification code has been sent to your email." });
    } catch (error) {
        console.error("Resend verification error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// FORGOT PASSWORD
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

        user.passwordResetToken = resetToken;
        user.passwordResetExpires = resetExpires;
        await user.save();

        await sendPasswordResetEmail(email, user.name, resetToken);

        res.status(200).json({ message: "Password reset email sent successfully" });
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// RESET PASSWORD
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }

        const user = await User.findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: Date.now() },
        });

        if (!user) return res.status(400).json({ message: "Invalid or expired reset token" });

        user.password = await bcrypt.hash(newPassword, 10);
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        await user.save();

        res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// CHANGE PASSWORD
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: "Both passwords are required" });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Current password is incorrect" });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.status(200).json({ success: true, message: "Password updated successfully" });
    } catch (error) {
        console.error("Change password error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// REFRESH TOKEN
exports.refreshToken = async (req, res) => {
    try {
        const presented = req.cookies && req.cookies.refreshToken;
        if (!presented) return res.status(401).json({ message: "No refresh token" });

        const existing = await RefreshToken.findOne({ token: presented, revokedAt: null });
        if (!existing || existing.expiresAt < new Date()) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }

        const user = await User.findById(existing.user);
        if (!user) return res.status(401).json({ message: "User not found" });

        await deleteRevokedToken(presented);

        const newRefreshTokenStr = await createRefreshToken(user._id);
        setRefreshCookie(res, newRefreshTokenStr);

        const newAccessToken = generateAccessToken(user);
        return res.status(200).json({ token: newAccessToken });
    } catch (error) {
        console.error("Refresh token error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// LOGOUT
exports.logout = async (req, res) => {
    try {
        const presented = req.cookies && req.cookies.refreshToken;

        // Revoke ALL active refresh tokens for this user, not just
        // the current cookie's token. This ensures that logging out on one device
        // invalidates all other active sessions (other devices/tabs).
        if (presented) {
            // Identify which user owns this token first
            const existing = await RefreshToken.findOne({ token: presented });
            if (existing) {
                // Delete ALL tokens for this user (global logout)
                await RefreshToken.deleteMany({ user: existing.user });
            } else {
                // Token not in DB (already revoked), still clear the cookie
                await RefreshToken.deleteOne({ token: presented });
            }
        }

        res.clearCookie("refreshToken", { path: "/" });
        return res.status(200).json({ message: "Logout successful" });
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ message: "Server error" });
    }
};