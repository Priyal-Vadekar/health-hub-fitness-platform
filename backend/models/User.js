const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please provide name"],
        minlength: 3,
        maxlength: 50
    },
    email: {
        type: String,
        required: [true, "Please provide email"],
        unique: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email"]
    },
    password: {
        type: String,
        minlength: 6, // optional for Google users
    },
    googleId: {
        type: String,
        default: null,
        unique: false
    },
    profilePic: {
        type: String,
    },

    role: {
        type: String,
        enum: ["Member", "Trainer", "RD", "RDN", "Admin", "Staff"],
        default: "Member"
    },

    // 🔹 NEW FIELDS
    height: {
        type: Number, // e.g. cm
        default: null
    },
    weight: {
        type: Number, // e.g. kg
        default: null
    },

    isCertified: {
        type: Boolean,
        default: false
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: {
        type: String,
        default: null
    },
    emailVerificationExpires: {
        type: Date,
        default: null
    },
    passwordResetToken: {
        type: String,
        default: null
    },
    passwordResetExpires: {
        type: Date,
        default: null
    },
    assignedDietitian: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        default: null,
        index: true
    },
    assignedTrainer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        default: null,
        index: true
    },
    specialization: {
        type: String,
        default: null
    },
});

// Add timestamps to track registration and update dates
typeof UserSchema.set === 'function' && UserSchema.set('timestamps', true);

// Hash password before saving (only for normal users)
UserSchema.pre("save", async function (next) {
    if (!this.isModified("password") || !this.password) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare passwords (only for normal users)
UserSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password) return false; // Google users don't have a password
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("users", UserSchema);
