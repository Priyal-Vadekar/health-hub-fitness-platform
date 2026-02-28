// // D:\Projects\Main Project\healthhub\backend\middleware\authMiddleware.js
// const jwt = require("jsonwebtoken");
// const User = require("../models/User"); // Import User model

// // Middleware to verify JWT token
// const authenticateUser = (req, res, next) => {
//     const authHeader = req.headers.authorization;

//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//         return res.status(401).json({ message: "No token provided" });
//     }

//     const token = authHeader.split(" ")[1];

//     try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         req.user = decoded;
//         next();
//     } catch (error) {
//         return res.status(400).json({ message: "Invalid token" });
//     }
// };

// // Middleware to check if user is an admin
// const isAdmin = async (req, res, next) => {
//     try {
//         const user = await User.findById(req.user.id);
//         if (!user || user.role !== "Admin") {
//             return res.status(403).json({ message: "Access denied. Admins only." });
//         }
//         next();
//     } catch (error) {
//         res.status(500).json({ message: "Authorization error", error });
//     }
// };

// // Role-Based Middleware
// const roleMiddleware = (roles) => (req, res, next) => {
//     if (!roles.includes(req.user.role)) {
//         return res.status(403).json({ message: "Access denied" });
//     }
//     next();
// };

// module.exports = { authenticateUser, isAdmin , roleMiddleware};

// backend/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware to verify JWT token
const authenticateUser = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        // ── FIX: was returning 400 which bypassed the refresh interceptor
        // http.js only triggers token refresh on 401, not 400
        // Returning 401 here lets the frontend interceptor catch it and
        // attempt a refresh before giving up and logging the user out
        return res.status(401).json({ message: "Token expired or invalid" });
    }
};

// Middleware to check if user is an admin
const isAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || user.role !== "Admin") {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: "Authorization error", error });
    }
};

// Role-Based Middleware
const roleMiddleware = (roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
    }
    next();
};

module.exports = { authenticateUser, isAdmin, roleMiddleware };