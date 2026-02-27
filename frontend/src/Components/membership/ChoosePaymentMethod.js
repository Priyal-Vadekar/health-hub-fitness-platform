// frontend/src/Components/membership/ChoosePaymentMethod.js
// Unified Payment Method Selection Page
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../css/StripePaymentPage.css";

const ChoosePaymentMethod = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};

  const { selectedPlan, totalPrice } = state;

  const goToPayment = (path) => {
    navigate(path, { state });
  };

  return (
    <div className="stripe-payment-container">
      <div className="payment-header">
        <h1>Choose Payment Method</h1>
        <p className="payment-subtitle">Select how you want to pay for your membership</p>
      </div>

      <div className="payment-content">
        {/* Order Summary */}
        {selectedPlan && (
          <div className="order-summary-card">
            <h2>Order Summary</h2>
            <div className="summary-item">
              <span className="summary-label">Plan:</span>
              <span className="summary-value">{selectedPlan.title}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Duration:</span>
              <span className="summary-value">
                {selectedPlan.duration} Month{selectedPlan.duration > 1 ? 's' : ''}
              </span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-item total">
              <span className="summary-label">Total Amount:</span>
              <span className="summary-value">₹{totalPrice || 0}</span>
            </div>
          </div>
        )}

        {/* Payment Options */}
        <div className="payment-method-card">
          <h2>Available Payment Methods</h2>
          
          <div style={{ display: "grid", gap: "1rem", marginTop: "1.5rem" }}>
            {/* Stripe Option */}
            <div className="payment-option-card">
              <div className="payment-option-header">
                <h3 style={{ color: "#FFD700", marginBottom: "0.5rem" }}>💳 Stripe</h3>
                <p style={{ color: "#ccc", fontSize: "0.9rem" }}>
                  International cards, Apple Pay, Google Pay
                </p>
              </div>
              <button 
                className="pay-btn" 
                onClick={() => goToPayment("/stripe-payment")}
                style={{ marginTop: "1rem" }}
              >
                Pay with Stripe →
              </button>
            </div>

            {/* Razorpay Option */}
            <div className="payment-option-card">
              <div className="payment-option-header">
                <h3 style={{ color: "#FFD700", marginBottom: "0.5rem" }}>📱 Razorpay (Test Mode)</h3>
                <p style={{ color: "#ccc", fontSize: "0.9rem" }}>
                  UPI, Cards, Wallets, Net Banking
                </p>
              </div>
              <button 
                className="pay-btn" 
                onClick={() => goToPayment("/razorpay-payment")}
                style={{ marginTop: "1rem" }}
              >
                Pay with Razorpay →
              </button>
            </div>

            {/* PayPal Option (if exists) */}
            <div className="payment-option-card">
              <div className="payment-option-header">
                <h3 style={{ color: "#FFD700", marginBottom: "0.5rem" }}>💼 PayPal</h3>
                <p style={{ color: "#ccc", fontSize: "0.9rem" }}>
                  PayPal balance or linked cards
                </p>
              </div>
              <button 
                className="pay-btn" 
                onClick={() => goToPayment("/checkout")}
                style={{ marginTop: "1rem" }}
              >
                Pay with PayPal →
              </button>
            </div>
          </div>

          {/* Back Button */}
          <div className="payment-actions" style={{ marginTop: "2rem" }}>
            <button
              className="back-btn"
              onClick={() => navigate("/membership-plan")}
              style={{ width: "100%" }}
            >
              ← Back to Membership Plans
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="security-notice">
          <p>🔒 All payment methods are secure and encrypted. Choose the one that works best for you.</p>
        </div>
      </div>
    </div>
  );
};

export default ChoosePaymentMethod;


