// backend/controllers/trainerBookingController.js
const TrainerBooking = require("../models/TrainerBooking");
const Payment = require("../models/Payment");
const User = require("../models/User");
const { sendEmail } = require("../config/emailService");

// Get bookings for a trainer
exports.getTrainerBookings = async (req, res) => {
  try {
    const trainerId = req.user.id;
    const { startDate, endDate, status } = req.query;

    const query = { trainer: trainerId };
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    if (status) {
      query.status = status;
    }

    const bookings = await TrainerBooking.find(query)
      .populate("member", "name email")
      .populate("payment")
      .sort({ date: 1, "timeSlot.start": 1 });

    res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error("Get trainer bookings error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get bookings for a member
exports.getMemberBookings = async (req, res) => {
  try {
    const memberId = req.user.id;
    const { startDate, endDate, status } = req.query;

    const query = { member: memberId };
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    if (status) {
      query.status = status;
    }

    const bookings = await TrainerBooking.find(query)
      .populate("trainer", "name email")
      .populate("payment")
      .sort({ date: 1, "timeSlot.start": 1 });

    res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error("Get member bookings error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create a booking (member creates, requires payment)
exports.createBooking = async (req, res) => {
  try {
    const memberId = req.user.id;
    const { trainerId, date, timeSlot, sessionPrice, notes } = req.body;

    if (!trainerId || !date || !timeSlot || !sessionPrice) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if trainer exists and is a trainer
    const trainer = await User.findById(trainerId);
    if (!trainer || trainer.role !== "Trainer") {
      return res.status(400).json({ message: "Invalid trainer" });
    }

    // Check for conflicts
    const conflict = await TrainerBooking.findOne({
      trainer: trainerId,
      date: new Date(date),
      status: { $in: ["pending", "confirmed"] },
      $or: [
        {
          "timeSlot.start": { $lt: timeSlot.end },
          "timeSlot.end": { $gt: timeSlot.start },
        },
      ],
    });

    if (conflict) {
      return res.status(400).json({ message: "Time slot already booked" });
    }

    const booking = await TrainerBooking.create({
      trainer: trainerId,
      member: memberId,
      date: new Date(date),
      timeSlot,
      sessionPrice,
      notes: notes || "",
      status: "pending", // Will be confirmed after payment
    });

    // Populate for response
    await booking.populate("trainer", "name email");
    await booking.populate("member", "name email");

    res.status(201).json({
      success: true,
      message: "Booking created. Please complete payment to confirm.",
      data: booking,
    });
  } catch (error) {
    console.error("Create booking error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Confirm booking (after payment)
exports.confirmBooking = async (req, res) => {
  try {
    const { bookingId, paymentId } = req.body;

    const booking = await TrainerBooking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({ message: "Booking is not pending" });
    }

    booking.status = "confirmed";
    booking.payment = paymentId;
    await booking.save();

    // Send notification emails (TODO: implement templates if needed)
    const trainer = await User.findById(booking.trainer);
    const member = await User.findById(booking.member);

    // Example placeholders:
    // await sendEmail(trainer.email, "New session booked", "You have a new booking.");
    // await sendEmail(member.email, "Session confirmed", "Your session is confirmed.");

    res.status(200).json({
      success: true,
      message: "Booking confirmed",
      data: booking,
    });
  } catch (error) {
    console.error("Confirm booking error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId, reason } = req.body;
    const userId = req.user.id;

    const booking = await TrainerBooking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if user is the member or trainer
    if (
      booking.member.toString() !== userId &&
      booking.trainer.toString() !== userId
    ) {
      return res.status(403).json({ message: "Not authorized to cancel this booking" });
    }

    if (booking.status === "cancelled" || booking.status === "completed") {
      return res.status(400).json({ message: "Booking cannot be cancelled" });
    }

    booking.status = "cancelled";
    booking.cancelledAt = new Date();
    booking.cancellationReason = reason || "";
    await booking.save();

    res.status(200).json({
      success: true,
      message: "Booking cancelled",
      data: booking,
    });
  } catch (error) {
    console.error("Cancel booking error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get available time slots for a trainer on a date
exports.getAvailableSlots = async (req, res) => {
  try {
    const { trainerId, date } = req.query;

    if (!trainerId || !date) {
      return res.status(400).json({ message: "trainerId and date are required" });
    }

    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);

    // Get all bookings for this trainer on this date
    const bookings = await TrainerBooking.find({
      trainer: trainerId,
      date: bookingDate,
      status: { $in: ["pending", "confirmed"] },
    });

    // Generate available slots (9 AM to 8 PM, 1-hour slots)
    const allSlots = [];
    for (let hour = 9; hour < 20; hour++) {
      allSlots.push({
        start: `${hour.toString().padStart(2, "0")}:00`,
        end: `${(hour + 1).toString().padStart(2, "0")}:00`,
      });
    }

    // Filter out booked slots
    const bookedSlots = bookings.map((b) => b.timeSlot);
    const availableSlots = allSlots.filter((slot) => {
      return !bookedSlots.some((booked) => {
        return slot.start < booked.end && slot.end > booked.start;
      });
    });

    res.status(200).json({
      success: true,
      data: availableSlots,
    });
  } catch (error) {
    console.error("Get available slots error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



