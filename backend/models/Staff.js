// backend\models\Staff.js
const mongoose = require("mongoose");

const StaffSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "users", 
        required: true 
    }, // Link staff to a user account
    role: {
        type: String,
        required: true
    },
    specialty: {
        type: String,
        required: function () {
            return this.role === "Trainer"; // Only required for trainers
        },
        default: ""
    },
    image: {
        type: String,
        required: [true, "Please provide an image"],
    },
    description: {
        type: String,
        required: [true, "Please provide a description"],
    },
    isCertified: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model("staffs", StaffSchema);