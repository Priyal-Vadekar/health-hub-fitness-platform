// frontend/src/Components/membership/TrainerBookingSuccess.js
// Route: /trainer-booking-success
// Receives state from TrainerCheckout after payment confirmed

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../css/StripePaymentPage.css";
import { FiCheckCircle, FiArrowRight } from "react-icons/fi";

const TrainerBookingSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { bookingId, trainerName, date, timeSlot, amount, paymentId } = location.state || {};
    const [countdown, setCountdown] = useState(8);

    useEffect(() => {
        if (!bookingId) { navigate("/member-dashboard"); return; }
        const timer = setInterval(() => {
            setCountdown(c => {
                if (c <= 1) { clearInterval(timer); navigate("/member-dashboard"); return 0; }
                return c - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [bookingId, navigate]);

    const formattedDate = date
        ? new Date(date).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
        : "—";

    return (
        <div className="stripe-payment-container" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
            <div className="payment-success-card">
                <div className="success-icon"><FiCheckCircle size={48} strokeWidth={1.5} /></div>
                <h1 style={{ color: "#FFD700", fontSize: "2rem", marginBottom: "0.5rem" }}>Booking Confirmed!</h1>
                <p style={{ color: "#ccc", marginBottom: "2rem" }}>Your trainer session has been successfully booked and confirmed.</p>

                <div style={{ background: "#1e1e2f", borderRadius: 12, padding: "1.5rem", textAlign: "left", marginBottom: "1.5rem" }}>
                    {[
                        ["Trainer", trainerName || "—"],
                        ["Date", formattedDate],
                        ["Time", timeSlot ? `${timeSlot.start} – ${timeSlot.end}` : "—"],
                        ["Duration", "1 hour"],
                        ["Amount Paid", `₹${amount}`],
                        ["Payment ID", paymentId || "—"],
                        ["Status", <><FiCheckCircle size={13} style={{ marginRight: 5, verticalAlign: "middle", color: "#28a745" }} />Confirmed</>],
                    ].map(([label, value]) => (
                        <div key={label} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #2a2a3b", padding: "0.6rem 0", fontSize: "0.92rem" }}>
                            <span style={{ color: "#aaa" }}>{label}:</span>
                            <span style={{ color: label === "Status" ? "#28a745" : "#fff", fontWeight: "500" }}>{value}</span>
                        </div>
                    ))}
                </div>

                <p style={{ color: "#888", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                    Redirecting to dashboard in <strong style={{ color: "#FFD700" }}>{countdown}s</strong>...
                </p>

                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                    <button
                        onClick={() => navigate("/member-dashboard")}
                        style={{ background: "#FFD700", color: "#1e1e2f", border: "none", padding: "12px 28px", borderRadius: 8, fontWeight: "bold", cursor: "pointer", fontSize: "1rem" }}
                    >
                        Go to Dashboard
                    </button>
                    <button
                        onClick={() => navigate("/member-dashboard", { state: { tab: "trainer-sessions" } })}
                        style={{ background: "transparent", color: "#FFD700", border: "1px solid #FFD700", padding: "12px 28px", borderRadius: 8, fontWeight: "bold", cursor: "pointer", fontSize: "1rem" }}
                    >
                        View My Sessions
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TrainerBookingSuccess;