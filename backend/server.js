require("dotenv").config({ path: "../frontend/.env" });
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

// Routes files
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const staffRoutes = require("./routes/staffRoutes");
const workoutRoutes = require("./routes/workoutRoutes");
const exerciseRoutes = require("./routes/exerciseRoutes");
const dietPlanRoutes = require("./routes/dietPlanRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const testimonialRoutes = require("./routes/testimonialRoutes");
const membershipPlanRoutes = require("./routes/membershipPlanRoutes");
const userMembershipRoutes = require("./routes/userMembershipRoutes");
const assignedDietPlanRoutes = require("./routes/assignedDietPlanRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const stripeRoutes = require("./routes/stripeRoutes");
const paypalRoutes = require("./routes/paypalRoutes");
const bankTransferRoutes = require("./routes/bankTransferRoutes");
const razorpayRoutes = require("./routes/razorpayRoutes");
const mealLogRoutes = require("./routes/mealLogRoutes");
const userProgressRoutes = require("./routes/userProgressRoutes");
const trainerBookingRoutes = require("./routes/trainerBookingRoutes");
const dietitianRoutes = require("./routes/dietitianRoutes");
const dosDontsRoutes = require("./routes/dosDontsRoutes");
const trainerRoutes = require("./routes/trainerRoutes");
const adminRoutes = require("./routes/adminRoutes");

// Firebase Admin SDK
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK using environment variables
admin.initializeApp({
  credential: admin.credential.cert({
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
  })
});

const app = express();

// Enhanced CORS Configuration
const corsOptions = {
  origin: ["http://localhost:3000"], // Add deployed frontend origin: ["http://localhost:3000", "https://your-deployed-frontend.com"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));

// Stripe and Razorpay webhooks must be before express.json() - needs raw body for signature verification
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));
app.use("/api/razorpay/webhook", express.raw({ type: "application/json" }));

app.use(express.json()); // Enable JSON body parsing
app.use(cookieParser());

// Improved MongoDB Connection Handling
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// Auth Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/exercises", exerciseRoutes);
app.use("/api/diet-plans", dietPlanRoutes);
app.use("/api/transactions", paymentRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/membership-plans", membershipPlanRoutes);
app.use("/api/user-membership-plans", userMembershipRoutes);
app.use("/api/assigned-dietplans", assignedDietPlanRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/stripe", stripeRoutes);
app.use("/api/paypal", paypalRoutes);
app.use("/api/bank-transfer", bankTransferRoutes);
app.use("/api/razorpay", razorpayRoutes);
app.use("/api/meal-logs", mealLogRoutes);
app.use("/api/progress", userProgressRoutes);
app.use("/api/bookings", trainerBookingRoutes);
app.use("/api/dietitian", dietitianRoutes);
app.use("/api/dos-donts", dosDontsRoutes);
app.use("/api/trainer", trainerRoutes);
app.use("/api/diet-plan-requests", require("./routes/dietPlanRequestRoutes"));
app.use("/api/admin", adminRoutes);
app.use("/api/diet-plan-requests", require("./routes/dietPlanRequestRoutes"));

// Root route
app.get("/", (req, res) => {
  res.send("Health Hub API is running...");
});

// Graceful Error Handling
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

