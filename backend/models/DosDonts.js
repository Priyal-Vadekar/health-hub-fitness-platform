// backend/models/DosDonts.js
const mongoose = require("mongoose");

const DosDontsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    dos: [
      {
        type: String,
        required: true,
      },
    ],
    donts: [
      {
        type: String,
        required: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("dos_donts", DosDontsSchema);



