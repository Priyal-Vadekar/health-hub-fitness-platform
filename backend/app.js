// D:\Projects\Main Project\healthhub\backend\app.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

app.use("/api/auth", require("./routes/authRoutes"));
const dietPlanRoutes = require("./routes/dietPlanRoutes");

module.exports = app;
