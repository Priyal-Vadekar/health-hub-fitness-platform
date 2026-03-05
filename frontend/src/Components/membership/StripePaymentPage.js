import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import "../../css/StripePaymentPage.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { http } from "../../api/http";

const StripePaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { userMembershipId, selectedPlan, totalPrice, withPersonalTrainer } =
    location.state || {};
  const sessionId = searchParams.get("session_id");

  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);

  // Check if returning from Stripe checkout
  useEffect(() => {
    if (sessionId) {
      verifyPaymentStatus(sessionId);
    } else if (!userMembershipId) {
      toast.error("No membership selected. Redirecting...");
      navigate("/membership-plan");
    }
  }, [sessionId, userMembershipId, navigate]);

  const verifyPaymentStatus = async (sessionId) => {
    try {
      setProcessing(true);
      const response = await http.get(`/stripe/verify-payment/${sessionId}`);

      if (response.data.paid) {
        setPaymentStatus("success");
        toast.success("Payment successful! Your membership is now active.");
        setTimeout(() => {
          navigate("/profile");
        }, 3000);
      } else {
        setPaymentStatus("pending");
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      setPaymentStatus("error");
    } finally {
      setProcessing(false);
    }
  };

  const handleStripeCheckout = async () => {
    if (!userMembershipId) {
      toast.error("Please select a membership plan first");
      navigate("/membership-plan");
      return;
    }

    try {
      setLoading(true);

      // Get auth token
      const authToken = JSON.parse(localStorage.getItem("auth") || "null");
      if (!authToken) {
        toast.error("Please login to continue");
        navigate("/login");
        return;
      }

      const response = await http.post(
        "/stripe/create-checkout-session",
        { userMembershipId }
      );

      if (response.data.success && response.data.url) {
        // Redirect to Stripe Checkout
        window.location.href = response.data.url;
      } else {
        toast.error("Failed to create checkout session");
      }
    } catch (error) {
      console.error("Stripe checkout error:", error);
      toast.error(
        error.response?.data?.message || "Failed to initiate payment"
      );
    } finally {
      setLoading(false);
    }
  };

  // If returning from Stripe with session_id
  if (sessionId) {
    return (
      <div className="stripe-payment-container">
        <div className="payment-status-card">
          {processing ? (
            <>
              <div className="spinner"></div>
              <h2>Verifying Payment...</h2>
              <p>Please wait while we confirm your payment.</p>
            </>
          ) : paymentStatus === "success" ? (
            <>
              <div className="success-icon">✓</div>
              <h2>Payment Successful!</h2>
              <p>
                Your membership has been activated. Redirecting to your
                profile...
              </p>
            </>
          ) : paymentStatus === "error" ? (
            <>
              <div className="error-icon">✗</div>
              <h2>Payment Verification Failed</h2>
              <p>
                There was an issue verifying your payment. Please contact
                support.
              </p>
              <button
                className="retry-btn"
                onClick={() => navigate("/profile")}
              >
                Go to Profile
              </button>
            </>
          ) : (
            <>
              <div className="pending-icon">⏳</div>
              <h2>Payment Pending</h2>
              <p>
                Your payment is being processed. This may take a few moments.
              </p>
              <button
                className="retry-btn"
                onClick={() => verifyPaymentStatus(sessionId)}
              >
                Check Again
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Initial payment page
  return (
    <div className="stripe-payment-container">
      <div className="payment-header">
        <h1>Complete Your Payment</h1>
        <p className="payment-subtitle">Secure payment powered by Stripe</p>
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
              {selectedPlan?.duration > 1 ? "s" : ""}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Personal Trainer:</span>
            <span className="summary-value">
              {withPersonalTrainer ? "✓ Included" : "✗ Not Included"}
            </span>
          </div>
          <div className="summary-divider"></div>
          <div className="summary-item total">
            <span className="summary-label">Total Amount:</span>
            <span className="summary-value">₹{totalPrice || 0}</span>
          </div>
        </div>

        {/* Payment Method */}
        <div className="payment-method-card">
          <h2>Payment Method</h2>
          <div className="stripe-info">
            <div className="stripe-logo">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="#6772e5">
                <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.905 0-4.72-.927-6.59-1.757l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.532-5.851-6.594-7.305h-.003z" />
              </svg>
              <span>Stripe</span>
            </div>
            <p className="stripe-description">
              Secure payment processing. Your payment information is encrypted
              and secure.
            </p>
            <div className="payment-features">
              <div className="feature-item">
                <span className="feature-icon">🔒</span>
                <span>256-bit SSL encryption</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>PCI DSS compliant</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">💳</span>
                <span>All major cards accepted</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="payment-actions">
          <button
            className="back-btn"
            onClick={() => navigate("/membership-plan")}
            disabled={loading}
          >
            ← Back to Plans
          </button>
          <button
            className="pay-btn"
            onClick={handleStripeCheckout}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-small"></span>
                Processing...
              </>
            ) : (
              <>
                Proceed to Payment
                <span className="arrow">→</span>
              </>
            )}
          </button>
        </div>

        {/* Security Notice */}
        <div className="security-notice">
          <p>
            🔒 Your payment is secured by Stripe. We never store your card
            details.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StripePaymentPage;
