// backend/controllers/testimonialController.js
const Testimonial = require('../models/Testimonial');

exports.getTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find().populate('user', 'name email');
    res.json(testimonials);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createTestimonial = async (req, res) => {
  const { user, message, active } = req.body;
  try {
    const newTestimonial = new Testimonial({ user, message, active });
    await newTestimonial.save();
    res.status(201).json(newTestimonial);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateTestimonial = async (req, res) => {
  const { id } = req.params;
  const { message, active } = req.body;
  try {
    const updated = await Testimonial.findByIdAndUpdate(
      id,
      { message, active },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteTestimonial = async (req, res) => {
  const { id } = req.params;
  try {
    await Testimonial.findByIdAndDelete(id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// backend/controllers/testimonialController.js

// Update the status of a specific testimonial (active/inactive)
exports.updateStatus = async (req, res) => {
  const { id } = req.params;  // Extract the testimonial ID from the URL parameters

  try {
    // Find the testimonial by ID and toggle the 'active' field (status)
    const testimonial = await Testimonial.findById(id);
    
    if (!testimonial) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }

    // Toggle the 'active' status (from true to false or vice versa)
    testimonial.active = !testimonial.active;
    await testimonial.save();  // Save the updated testimonial

    // Send back the updated testimonial as a response
    res.json({ message: 'Testimonial status updated', testimonial });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
