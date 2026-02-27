import React from "react";
import { useNavigate } from "react-router-dom";
import "../../css/StripePaymentPage.css";

const RazorpayCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="stripe-payment-container">
      <div className="payment-success-card" style={{ borderColor: "#ffc107" }}>
        <div className="success-icon" style={{ background: "#ffc107", color: "#1e1e2f" }}>⚠</div>
        <h1 style={{ color: "#FFD700" }}>Payment Canceled</h1>
        <p style={{ color: "#ccc", marginBottom: "24px" }}>
          Your payment was canceled. No charges were made. You can try again anytime.
        </p>
        <div className="payment-actions">
          <button className="pay-btn" onClick={() => navigate("/checkout")}>
            Try Again
          </button>
          <button className="back-btn" onClick={() => navigate("/membership-plan")}>
            Back to Plans
          </button>
        </div>
      </div>
    </div>
  );
};

export default RazorpayCancel;


