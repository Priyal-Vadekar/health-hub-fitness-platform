// backend/routes/testimonialRoutes.js
const express = require('express');
const router = express.Router();
const {
    getTestimonials,
    createTestimonial,
    updateTestimonial,
    deleteTestimonial,
    updateStatus
} = require('../controllers/testimonialController');

// Existing routes
router.get('/all-testimonials', getTestimonials);
router.post('/new-testimonial', createTestimonial);
router.put('/update-testimonial/:id', updateTestimonial);
router.delete('/delete-testimonial/:id', deleteTestimonial);

// New route for updating testimonial status
router.put('/:id/status', updateStatus);  // This will handle PUT requests for toggling status

module.exports = router;
