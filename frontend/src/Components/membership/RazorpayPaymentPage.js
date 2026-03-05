// frontend/src/Components/membership/RazorpayPaymentPage.js
// Razorpay Payment Integration (Test Mode Only)
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../css/StripePaymentPage.css";
import { toast } from "react-toastify";
import { http } from "../../api/http";

// Load Razorpay SDK dynamically
const loadRazorpayScript = (src) =>
  new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const RazorpayPaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userMembershipId, selectedPlan, totalPrice, withPersonalTrainer } =
    location.state || {};

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userMembershipId) {
      toast.error("No membership found. Redirecting...");
      navigate("/membership-plan");
    }
  }, [userMembershipId, navigate]);

  const getAuthToken = () => JSON.parse(localStorage.getItem("auth") || "null");

  // Calculate price breakdown for display
  const calculatePriceBreakdown = () => {
    if (!selectedPlan)
      return {
        basePrice: 0,
        personalTrainer: 0,
        discountAmount: 0,
        subtotal: 0,
        total: 0,
        discountText: null,
      };

    let basePrice = selectedPlan.price || 0;
    let personalTrainer = withPersonalTrainer
      ? selectedPlan.personalTrainerCharge || 0
      : 0;
    let subtotal = basePrice + personalTrainer;
    let discountAmount = 0;
    let discountText = null;

    // Calculate discount
    if (selectedPlan.discount) {
      const discountStr = selectedPlan.discount.toString().trim();
      const hasPercent = discountStr.includes("%");
      const numericValue = parseFloat(discountStr.replace(/[^0-9.]/g, ""));

      if (!isNaN(numericValue)) {
        if (hasPercent) {
          discountAmount = subtotal * (numericValue / 100);
          discountText = `${numericValue}% off`;
        } else if (numericValue <= 100) {
          discountAmount = subtotal * (numericValue / 100);
          discountText = `${numericValue}% off`;
        } else {
          discountAmount = numericValue;
          discountText = `₹${numericValue} off`;
        }
      }
    }

    const total = Math.max(0, subtotal - discountAmount);

    return {
      basePrice: Math.round(basePrice * 100) / 100,
      personalTrainer: Math.round(personalTrainer * 100) / 100,
      subtotal: Math.round(subtotal * 100) / 100,
      discountAmount: Math.round(discountAmount * 100) / 100,
      discountText,
      total: Math.round(total * 100) / 100,
    };
  };

  const priceBreakdown = calculatePriceBreakdown();

  const handlePayWithRazorpay = async () => {
    try {
      setLoading(true);

      // Load Razorpay SDK
      const loaded = await loadRazorpayScript(
        "https://checkout.razorpay.com/v1/checkout.js"
      );

      if (!loaded) {
        toast.error(
          "Failed to load Razorpay SDK. Please check your internet connection."
        );
        return;
      }

      // Get auth token
      const token = getAuthToken();
      if (!token) {
        toast.error("Please login to continue");
        navigate("/login");
        return;
      }

      // Create Razorpay order
      const orderRes = await http.post(
        "/razorpay/create-order",
        { userMembershipId }
      );

      if (!orderRes.data.success) {
        toast.error("Unable to create order");
        return;
      }

      const { orderId, amount, currency, keyId, membership } = orderRes.data;

      // Razorpay checkout options
      const options = {
        key: keyId, // Razorpay Test Key ID
        amount: amount, // Amount in paise
        currency: currency,
        name: "HealthHub",
        description: `${membership.title} - ${membership.duration} Month${membership.duration > 1 ? "s" : ""
          }`,
        order_id: orderId,
        handler: function (response) {
          // Payment successful - redirect to success page with payment details
          navigate(
            `/razorpay-success?razorpay_payment_id=${response.razorpay_payment_id}&razorpay_order_id=${response.razorpay_order_id}&razorpay_signature=${response.razorpay_signature}`
          );
        },
        prefill: {
          name: "HealthHub User",
          email: "user@healthhub.com",
        },
        notes: {
          membership: membership.title,
          userMembershipId: userMembershipId,
        },
        theme: {
          color: "#FFD700", // Gold color matching your theme
        },
        modal: {
          ondismiss: function () {
            navigate("/razorpay-cancel");
          },
        },
      };

      const paymentObject = new window.Razorpay(options);

      paymentObject.on("payment.failed", function (response) {
        navigate(
          `/razorpay-failed?error=${encodeURIComponent(
            response.error.description || "Payment failed"
          )}`
        );
      });

      paymentObject.open();
    } catch (error) {
      console.error("Razorpay payment error:", error);
      toast.error(
        error.response?.data?.message || "Failed to initiate Razorpay payment"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stripe-payment-container">
      <div className="payment-header">
        <h1>Pay with Razorpay</h1>
        <p className="payment-subtitle">
          Supports UPI, Cards, Wallets & More (Test Mode)
        </p>
      </div>

      <div className="payment-content">
        {/* Order Summary */}
        <div className="order-summary-card">
          <h2>Order Summary</h2>
          <div className="summary-item">
            <span className="summary-label">Plan:</span>
            <span className="summary-value">
              {selectedPlan?.title || "N/A"}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Duration:</span>
            <span className="summary-value">
              {selectedPlan?.duration || 0} Month
              {(selectedPlan?.duration || 0) > 1 ? "s" : ""}
            </span>
          </div>

          <div className="summary-divider"></div>

          {/* Price Breakdown */}
          <div className="summary-item">
            <span className="summary-label">Base Price:</span>
            <span className="summary-value">₹{priceBreakdown.basePrice}</span>
          </div>

          {withPersonalTrainer && priceBreakdown.personalTrainer > 0 && (
            <div className="summary-item">
              <span className="summary-label">Personal Trainer:</span>
              <span className="summary-value">
                +₹{priceBreakdown.personalTrainer}
              </span>
            </div>
          )}

          {priceBreakdown.discountAmount > 0 && (
            <div className="summary-item" style={{ color: "#28a745" }}>
              <span className="summary-label">
                Discount ({priceBreakdown.discountText}):
              </span>
              <span className="summary-value">
                -₹{priceBreakdown.discountAmount}
              </span>
            </div>
          )}

          <div className="summary-divider"></div>
          <div className="summary-item total">
            <span className="summary-label">Total Amount:</span>
            <span className="summary-value">₹{priceBreakdown.total}</span>
          </div>
        </div>

        {/* Payment Info */}
        <div className="payment-method-card">
          <h2>Razorpay Payment</h2>
          <div className="stripe-info">
            <div className="stripe-description">
              <p style={{ color: "#ccc", marginBottom: "1rem" }}>
                Secure payment gateway supporting multiple payment methods:
              </p>
              <div className="payment-features">
                <div className="feature-item">
                  <span className="feature-icon">💳</span>
                  <span>Credit/Debit Cards</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">📱</span>
                  <span>UPI (Google Pay, PhonePe, etc.)</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">💰</span>
                  <span>Wallets & Net Banking</span>
                </div>
              </div>
              <p
                style={{
                  color: "#ffc107",
                  fontSize: "0.9rem",
                  marginTop: "1rem",
                  fontWeight: "bold",
                }}
              >
                ⚠️ Test Mode: Use test payment methods only
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="payment-actions">
            <button
              className="back-btn"
              onClick={() => navigate("/checkout")}
              disabled={loading}
            >
              ← Back to Payment Options
            </button>
            <button
              className="pay-btn"
              onClick={handlePayWithRazorpay}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Processing...
                </>
              ) : (
                <>
                  Pay ₹{priceBreakdown.total}
                  <span className="arrow">→</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="security-notice">
          <p>
            🔒 Payments are processed securely by Razorpay. We never store your
            card details.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RazorpayPaymentPage;
