const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
    getAllTrainers,
    createStaff,
    getAllStaff,
    getStaffById,
    updateStaff,
    deleteStaff,
    getTrainerPerformance
} = require("../controllers/staffController");

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Save images to a directory within frontend/public/Images
        // Corrected path: go up two levels from backend/routes to reach the project root
        const uploadPath = path.join(__dirname, '../../frontend/public/Images/staffImages');
        // Ensure the directory exists
        require('fs').mkdir(uploadPath, { recursive: true }, (err) => {
            if (err) return cb(err);
            cb(null, uploadPath);
        });
    },
    filename: (req, file, cb) => {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`); // Generate a unique filename
    }
});

const upload = multer({ storage });

// Report routes must come before parameterized routes
router.get('/report/performance', getTrainerPerformance);

// Trainers-specific route
router.get("/trainers", getAllTrainers); // Get only trainers

// CRUD routes
router.post("/new-staff", upload.single('image'), createStaff); // Create staff with image upload
router.get("/", getAllStaff); // Get all staff
router.get("/:id", getStaffById); // Get a staff member by ID
router.patch("/update-staff/:id", updateStaff); // Update staff details
router.delete("/delete-staff/:id", deleteStaff); // Delete staff member

module.exports = router;
