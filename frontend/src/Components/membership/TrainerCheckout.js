// frontend/src/Components/membership/TrainerCheckout.js
// Route: /trainer-checkout
// Receives state: { bookingId, amount, trainerId, trainerName, date, timeSlot }
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { http } from "../../api/http";
import {
    FiArrowLeft, FiArrowRight, FiAlertTriangle, FiLock, FiLoader
} from "react-icons/fi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../css/StripePaymentPage.css";

// ── Razorpay SDK loader ───────────────────────────────────────────────────────
const loadRazorpay = (src) =>
    new Promise((resolve) => {
        if (window.Razorpay) { resolve(true); return; }
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });

// ── Bank Transfer sub-form ────────────────────────────────────────────────────
const BankForm = ({ onSubmit, loading }) => {
    const [ref, setRef] = useState("");
    const [note, setNote] = useState("");
    return (
        <div>
            <div style={{ color: "#eee", marginBottom: 12, fontSize: "0.9rem", lineHeight: 1.6 }}>
                Transfer to:<br />
                <strong>HealthHub Pvt Ltd</strong> · HDFC Bank<br />
                A/C: 1234567890 · IFSC: HDFC000000
            </div>
            <div style={{ display: "grid", gap: 12 }}>
                <input placeholder="Reference Number *" value={ref} onChange={e => setRef(e.target.value)}
                    style={{ padding: 12, borderRadius: 8, border: "1px solid #3a3a4a", background: "#1e1e2f", color: "#fff" }} />
                <input placeholder="Note (optional)" value={note} onChange={e => setNote(e.target.value)}
                    style={{ padding: 12, borderRadius: 8, border: "1px solid #3a3a4a", background: "#1e1e2f", color: "#fff" }} />
            </div>
            <div className="payment-actions" style={{ marginTop: 16 }}>
                <button className="back-btn" onClick={() => window.history.back()}><FiArrowLeft size={14} style={{ marginRight: 6 }} />Back</button>
                <button className="pay-btn" onClick={() => onSubmit(ref, note)} disabled={loading || !ref}>
                    {loading ? "Submitting..." : "Submit Transfer Details"}
                </button>
            </div>
        </div>
    );
};

// ── Main TrainerCheckout ──────────────────────────────────────────────────────
const TrainerCheckout = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const { bookingId, amount, trainerId, trainerName, date, timeSlot } = location.state || {};

    const [method, setMethod] = useState("razorpay");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!bookingId) {
            toast.error("No booking found. Please book a session first.");
            navigate("/member-dashboard");
        }
    }, [bookingId, navigate]);

    // ── Navigate to success ───────────────────────────────────────────────────
    const goToSuccess = (paymentId) => {
        navigate("/trainer-booking-success", {
            state: { bookingId, trainerName, date, timeSlot, amount, paymentId },
        });
    };

    // ── Confirm booking (idempotent-safe) ─────────────────────────────────────
    // Returns true if the booking ended up confirmed, false on real errors.
    const confirmBooking = async (paymentId) => {
        try {
            const res = await http.post("/bookings/confirm", { bookingId, paymentId });
            // Both "Booking confirmed" and "Booking already confirmed" return success:true
            return res.data.success === true;
        } catch (e) {
            const status = e.response?.status;
            const msg = (e.response?.data?.message || "").toLowerCase();
            // Backward compat: if backend is still old and returns 400 "not pending",
            // the booking was already confirmed by the webhook → treat as success
            if (status === 400 && (msg.includes("not pending") || msg.includes("already confirmed"))) {
                return true;
            }
            console.error("Confirm booking error:", e);
            return false;
        }
    };

    // ── Razorpay ──────────────────────────────────────────────────────────────
    const startRazorpay = async () => {
        try {
            setLoading(true);

            const loaded = await loadRazorpay("https://checkout.razorpay.com/v1/checkout.js");
            if (!loaded) {
                toast.error("Failed to load Razorpay SDK. Check your internet connection.");
                setLoading(false);
                return;
            }

            // Create backend Razorpay order
            const res = await http.post("/razorpay/create-trainer-order", { bookingId, amount });
            if (!res.data.success) {
                toast.error(res.data.message || "Unable to create order. Please try again.");
                setLoading(false);
                return;
            }

            const { orderId, currency, keyId } = res.data;

            const options = {
                key: keyId,
                amount: Math.round(parseFloat(amount) * 100),
                currency: currency || "INR",
                name: "HealthHub",
                description: `Trainer Session – ${trainerName || ""}`,
                order_id: orderId,

                // ── Success handler ──────────────────────────────────────────────────
                // Razorpay calls this after the user completes payment in the popup.
                // The webhook may have already confirmed the booking — that's fine,
                // confirmBooking handles both cases and always returns true when confirmed.
                handler: async function (response) {
                    try {
                        const confirmed = await confirmBooking(response.razorpay_payment_id);
                        setLoading(false);
                        if (confirmed) {
                            goToSuccess(response.razorpay_payment_id);
                        } else {
                            toast.error("Payment received but confirmation failed. Please contact support.");
                        }
                    } catch (err) {
                        setLoading(false);
                        toast.error("An unexpected error occurred after payment. Please contact support.");
                    }
                },

                prefill: { name: "HealthHub Member" },
                notes: { bookingId, trainerId },
                theme: { color: "#FFD700" },

                modal: {
                    // User closed the popup without completing payment
                    ondismiss: () => {
                        setLoading(false);
                        toast.info("Payment cancelled.");
                    },
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.on("payment.failed", function () {
                setLoading(false);
                toast.error("Payment failed. Please try again.");
            });

            // Open the Razorpay popup — loading stays true until handler/ondismiss fires
            rzp.open();

        } catch (e) {
            setLoading(false);
            toast.error(e.response?.data?.message || "Failed to start payment. Please try again.");
        }
    };

    // ── Stripe ────────────────────────────────────────────────────────────────
    const startStripe = async () => {
        try {
            setLoading(true);
            const res = await http.post("/stripe/create-trainer-session", { bookingId, amount });
            if (res.data?.url) {
                window.location.href = res.data.url; // Redirects away — loading irrelevant
            } else {
                toast.error("Could not start Stripe checkout. Please try again.");
                setLoading(false);
            }
        } catch (e) {
            setLoading(false);
            toast.error(e.response?.data?.message || "Stripe init failed. Please try again.");
        }
    };

    // ── Bank Transfer ─────────────────────────────────────────────────────────
    const submitBank = async (referenceNumber, note) => {
        try {
            setLoading(true);
            const confirmed = await confirmBooking(`BANK-${referenceNumber}`);
            if (confirmed) {
                toast.success("Bank transfer submitted. Booking confirmed pending verification.");
                goToSuccess(`BANK-${referenceNumber}`);
            } else {
                toast.error("Failed to confirm booking. Contact support with ref: " + referenceNumber);
            }
        } catch (e) {
            toast.error("Bank transfer submission failed.");
        } finally {
            setLoading(false);
        }
    };

    const formattedDate = date
        ? new Date(date).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
        : "—";

    return (
        <div className="stripe-payment-container">
            <div className="payment-header">
                <h1>Trainer Session Checkout</h1>
                <p className="payment-subtitle">Complete payment to confirm your session</p>
            </div>

            <div className="payment-content">
                {/* ── Order Summary ── */}
                <div className="order-summary-card">
                    <h2>Session Summary</h2>
                    <div className="summary-item">
                        <span className="summary-label">Trainer:</span>
                        <span className="summary-value">{trainerName || "Trainer"}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Date:</span>
                        <span className="summary-value">{formattedDate}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Time Slot:</span>
                        <span className="summary-value">{timeSlot?.start} – {timeSlot?.end}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Duration:</span>
                        <span className="summary-value">1 hour</span>
                    </div>
                    <div className="summary-divider" />
                    <div className="summary-item total">
                        <span className="summary-label">Total Amount:</span>
                        <span className="summary-value">₹{amount}</span>
                    </div>
                </div>

                {/* ── Payment Method ── */}
                <div className="payment-method-card">
                    <h2>Payment Method</h2>

                    <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                        {[
                            ["razorpay", "Razorpay (UPI/Cards)"],
                            ["stripe", "Stripe (Cards/UPI)"],
                            ["bank", "Bank Transfer"],
                        ].map(([id, label]) => (
                            <button
                                key={id}
                                className={`back-btn ${method === id ? "selected" : ""}`}
                                onClick={() => setMethod(id)}
                                disabled={loading}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {method === "razorpay" && (
                        <div style={{ color: "#ccc" }}>
                            <p>Pay securely via Razorpay. Supports UPI, Cards, Wallets &amp; Net Banking.</p>
                            <p style={{ color: "#ffc107", fontSize: "0.9rem", marginTop: "0.5rem" }}>
                                ⚠️ Test Mode: Use test payment methods only
                            </p>
                            <div className="payment-actions">
                                <button className="back-btn" onClick={() => navigate("/member-dashboard")} disabled={loading}>
                                    ← Back
                                </button>
                                <button className="pay-btn" onClick={startRazorpay} disabled={loading}>
                                    {loading
                                        ? <><span className="spinner-small" style={{ marginRight: 8 }} />Processing…</>
                                        : <>Pay ₹{amount} with Razorpay <FiArrowRight size={14} style={{ marginLeft: 6 }} /></>
                                    }
                                </button>
                            </div>
                        </div>
                    )}

                    {method === "stripe" && (
                        <div style={{ color: "#ccc" }}>
                            <p>Pay securely via Stripe Checkout. Supports cards, UPI, and wallets.</p>
                            <p style={{ color: "#ffc107", fontSize: "0.9rem", marginTop: "0.5rem" }}>
                                ⚠️ Test Mode: Use test payment methods only
                            </p>
                            <div className="payment-actions">
                                <button className="back-btn" onClick={() => navigate("/member-dashboard")} disabled={loading}>
                                    ← Back
                                </button>
                                <button className="pay-btn" onClick={startStripe} disabled={loading}>
                                    {loading ? "Processing…" : <>Pay ₹{amount} with Stripe <FiArrowRight size={14} style={{ marginLeft: 6 }} /></>}
                                </button>
                            </div>
                        </div>
                    )}

                    {method === "bank" && <BankForm onSubmit={submitBank} loading={loading} />}
                </div>

                <div className="security-notice">
                    <p><FiLock size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />Payments are processed securely. We never store your card details.</p>
                </div>
            </div>
        </div>
    );
};

export default TrainerCheckout;