import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../layout/Layout";
import { http } from "../../api/http";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../css/TrainerBooking.css";

const TrainerBooking = () => {
  const navigate = useNavigate();
  const { trainerId } = useParams();
  const [trainer, setTrainer] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [hourlyRate, setHourlyRate] = useState(0);
  const [loading, setLoading] = useState(false);
  const [myBookings, setMyBookings] = useState([]);

  useEffect(() => {
    if (trainerId) {
      fetchTrainerDetails();
      fetchAvailableSlots();
    }
    fetchMyBookings();
  }, [trainerId, selectedDate]);

  const fetchTrainerDetails = async () => {
    try {
      const response = await http.get(`/users/${trainerId}`);
      if (response.data.success) {
        setTrainer(response.data.data);
        setHourlyRate(1000); // Default ₹1000/hour
      }
    } catch (error) {
      console.error("Error fetching trainer:", error);
      toast.error("Failed to load trainer details");
    }
  };

  const fetchAvailableSlots = async () => {
    if (!trainerId) return;
    try {
      const dateStr = selectedDate.toISOString().split("T")[0];
      const response = await http.get("/bookings/available-slots", {
        params: { trainerId, date: dateStr },
      });
      if (response.data.success) {
        setAvailableSlots(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching available slots:", error);
    }
  };

  const fetchMyBookings = async () => {
    try {
      const response = await http.get("/bookings/member");
      if (response.data.success) {
        setMyBookings(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  };

  const handleBookSession = async () => {
    if (!selectedSlot || !trainerId) {
      toast.error("Please select a time slot");
      return;
    }

    try {
      setLoading(true);
      const dateStr = selectedDate.toISOString().split("T")[0];
      const response = await http.post("/bookings", {
        trainerId,
        date: dateStr,
        timeSlot: selectedSlot,
        sessionPrice: hourlyRate, // 1 hour session
        notes: "",
      });

      if (response.data.success) {
        const booking = response.data.data;
        toast.success("Booking created! Please complete payment to confirm.");

        navigate("/checkout", {
          state: {
            bookingId: booking._id,
            amount: hourlyRate,
            type: "trainer_booking",
            trainerId,
            booking,
          },
        });
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error(
        error.response?.data?.message || "Failed to create booking"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Cancel this booking?")) return;

    try {
      const response = await http.post("/bookings/cancel", {
        bookingId,
        reason: "Cancelled by member",
      });

      if (response.data.success) {
        toast.success("Booking cancelled");
        fetchMyBookings();
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast.error("Failed to cancel booking");
    }
  };

  const upcomingBookings = myBookings.filter(
    (b) => new Date(b.date) >= new Date() && b.status === "confirmed"
  );
  const pastBookings = myBookings.filter(
    (b) => new Date(b.date) < new Date() || b.status === "completed"
  );

  return (
    <Layout>
      <div className="trainer-booking-container">
        <div className="booking-header">
          <h1>Book Trainer Session</h1>
          {trainer && (
            <div className="trainer-info-card">
              <h3>{trainer.name}</h3>
              {trainer.isCertified && (
                <span className="certified-badge">✔ Certified</span>
              )}
              <p>Hourly Rate: ₹{hourlyRate}/hour</p>
            </div>
          )}
        </div>

        <div className="booking-content">
          <div className="booking-section">
            <h2>Select Date & Time</h2>
            <div className="date-picker">
              <label>Date:</label>
              <input
                type="date"
                value={selectedDate.toISOString().split("T")[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="time-slots">
              <h3>Available Time Slots</h3>
              {availableSlots.length === 0 ? (
                <p className="no-slots">No available slots for this date</p>
              ) : (
                <div className="slots-grid">
                  {availableSlots.map((slot, idx) => (
                    <button
                      key={idx}
                      className={`slot-btn ${
                        selectedSlot?.start === slot.start ? "selected" : ""
                      }`}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {slot.start} - {slot.end}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedSlot && (
              <div className="booking-summary">
                <h3>Booking Summary</h3>
                <div className="summary-item">
                  <span>Date:</span>
                  <span>{selectedDate.toLocaleDateString()}</span>
                </div>
                <div className="summary-item">
                  <span>Time:</span>
                  <span>
                    {selectedSlot.start} - {selectedSlot.end}
                  </span>
                </div>
                <div className="summary-item">
                  <span>Duration:</span>
                  <span>1 hour</span>
                </div>
                <div className="summary-item total">
                  <span>Total:</span>
                  <span>₹{hourlyRate}</span>
                </div>
                <button
                  className="book-btn"
                  onClick={handleBookSession}
                  disabled={loading || !selectedSlot}
                >
                  {loading ? "Processing..." : "Book Session"}
                </button>
              </div>
            )}
          </div>

          <div className="my-bookings-section">
            <h2>My Trainer Sessions</h2>

            <div className="bookings-tabs">
              <button className="active">Upcoming</button>
            </div>

            {upcomingBookings.length === 0 && pastBookings.length === 0 ? (
              <p className="no-bookings">No bookings yet</p>
            ) : (
              <>
                {upcomingBookings.length > 0 && (
                  <div className="bookings-list">
                    <h3>Upcoming Sessions</h3>
                    {upcomingBookings.map((booking) => (
                      <div key={booking._id} className="booking-card">
                        <div className="booking-info">
                          <h4>{booking.trainer?.name || "Trainer"}</h4>
                          <p>{new Date(booking.date).toLocaleDateString()}</p>
                          <p>
                            {booking.timeSlot.start} - {booking.timeSlot.end}
                          </p>
                          <p>
                            Status:{" "}
                            <span className={`status ${booking.status}`}>
                              {booking.status}
                            </span>
                          </p>
                        </div>
                        {booking.status === "pending" && (
                          <button
                            className="cancel-btn"
                            onClick={() => handleCancelBooking(booking._id)}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {pastBookings.length > 0 && (
                  <div className="bookings-list">
                    <h3>Past Sessions</h3>
                    {pastBookings.map((booking) => (
                      <div key={booking._id} className="booking-card past">
                        <div className="booking-info">
                          <h4>{booking.trainer?.name || "Trainer"}</h4>
                          <p>{new Date(booking.date).toLocaleDateString()}</p>
                          <p>
                            {booking.timeSlot.start} - {booking.timeSlot.end}
                          </p>
                          <p>
                            Status:{" "}
                            <span className={`status ${booking.status}`}>
                              {booking.status}
                            </span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TrainerBooking;

