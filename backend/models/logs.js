// backend\models\logs.js
const mongoose = require("mongoose");

const LogSchema = new mongoose.Schema({
  level: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const Log = mongoose.model("logs", LogSchema);

module.exports = Log;
