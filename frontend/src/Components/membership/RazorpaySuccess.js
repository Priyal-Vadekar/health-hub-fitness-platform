import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../../css/StripePaymentPage.css";
import { http } from "../../api/http";

const RazorpaySuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);

  useEffect(() => {
    const verifyPayment = async () => {
      const paymentId = searchParams.get("razorpay_payment_id");
      const orderId = searchParams.get("razorpay_order_id");
      const signature = searchParams.get("razorpay_signature");

      if (!paymentId || !orderId || !signature) {
        setVerifying(false);
        setPaymentStatus("error");
        return;
      }

      try {
        const token = JSON.parse(localStorage.getItem("auth") || "null");
        if (!token) {
          navigate("/login");
          return;
        }

        // Verify payment on backend
        const response = await http.post(
          "/razorpay/verify-payment",
          {
            razorpay_payment_id: paymentId,
            razorpay_order_id: orderId,
            razorpay_signature: signature,
          }
        );

        if (response.data.success) {
          setPaymentStatus("success");
        } else {
          setPaymentStatus("failed");
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        setPaymentStatus("error");
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [navigate, searchParams]);

  if (verifying) {
    return (
      <div className="stripe-payment-container">
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div className="spinner-large"></div>
          <h2 style={{ color: "#FFD700", marginTop: "20px" }}>
            Verifying your payment...
          </h2>
          <p style={{ color: "#ccc" }}>
            Please wait while we confirm your transaction.
          </p>
        </div>
      </div>
    );
  }

  if (paymentStatus === "success") {
    return (
      <div className="stripe-payment-container">
        <div className="payment-success-card">
          <div className="success-icon">✓</div>
          <h1 style={{ color: "#FFD700" }}>Payment Successful!</h1>
          <p style={{ color: "#ccc", marginBottom: "24px" }}>
            Your membership has been activated. You can now access all premium
            features.
          </p>
          <div className="payment-actions">
            <button
              className="pay-btn"
              onClick={() => navigate("/membership-plan")}
            >
              View My Membership
            </button>
            <button className="back-btn" onClick={() => navigate("/")}>
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (paymentStatus === "failed" || paymentStatus === "error") {
    return (
      <div className="stripe-payment-container">
        <div
          className="payment-success-card"
          style={{ borderColor: "#dc3545" }}
        >
          <div className="success-icon" style={{ background: "#dc3545" }}>
            ✗
          </div>
          <h1 style={{ color: "#dc3545" }}>Payment Failed</h1>
          <p style={{ color: "#ccc", marginBottom: "24px" }}>
            {paymentStatus === "failed"
              ? "Your payment could not be processed. Please try again."
              : "There was an error verifying your payment. Please contact support if the amount was deducted."}
          </p>
          <div className="payment-actions">
            <button className="pay-btn" onClick={() => navigate("/checkout")}>
              Try Again
            </button>
            <button
              className="back-btn"
              onClick={() => navigate("/membership-plan")}
            >
              Back to Plans
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default RazorpaySuccess;
