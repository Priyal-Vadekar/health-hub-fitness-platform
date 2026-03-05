import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../css/StripePaymentPage.css";
import { toast } from "react-toastify";
import { http } from "../../api/http";

const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    userId,
    membershipPlanId,
    selectedPlan,
    totalPrice,
    withPersonalTrainer,
  } = location.state || {};

  const [method, setMethod] = useState("stripe");
  const [loading, setLoading] = useState(false);

  // Load Razorpay SDK dynamically
  const loadRazorpayScript = (src) =>
    new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  // Calculate price breakdown
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
          // Percentage discount (e.g., "5%", "5% off")
          discountAmount = subtotal * (numericValue / 100);
          discountText = `${numericValue}% off`;
        } else {
          // If no % symbol, check if it's likely a percentage (small number) or fixed amount
          // If value is <= 100, assume it's a percentage (common discount range: 5%, 10%, 20%, etc.)
          // If value is > 100, assume it's a fixed amount in rupees
          if (numericValue <= 100) {
            // Treat as percentage
            discountAmount = subtotal * (numericValue / 100);
            discountText = `${numericValue}% off`;
          } else {
            // Treat as fixed amount
            discountAmount = numericValue;
            discountText = `₹${numericValue} off`;
          }
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

  useEffect(() => {
    if (!membershipPlanId) {
      toast.error("No membership plan selected. Redirecting...");
      navigate("/membership-plan");
    }
  }, [membershipPlanId, navigate]);

  const getAuthToken = () => JSON.parse(localStorage.getItem("auth") || "null");

  const startStripe = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        toast.error("Login required");
        navigate("/login");
        return;
      }
      const res = await http.post(
        "/stripe/create-checkout-session",
        { membershipPlanId, withPersonalTrainer }
      );
      if (res.data?.url) window.location.href = res.data.url;
      else toast.error("Could not start Stripe checkout");
    } catch (e) {
      toast.error(e.response?.data?.message || "Stripe init failed");
    } finally {
      setLoading(false);
    }
  };

  const startRazorpay = async () => {
    try {
      setLoading(true);

      // Load Razorpay SDK
      const loaded = await loadRazorpayScript(
        "https://checkout.razorpay.com/v1/checkout.js"
      );

      if (!loaded) {
        toast.error("Failed to load Razorpay SDK");
        setLoading(false);
        return;
      }

      const token = getAuthToken();
      if (!token) {
        toast.error("Login required");
        navigate("/login");
        return;
      }

      // Create Razorpay order
      const res = await http.post(
        "/razorpay/create-order",
        { membershipPlanId, withPersonalTrainer }
      );

      if (!res.data.success) {
        toast.error("Unable to create order");
        setLoading(false);
        return;
      }

      const { orderId, amount, currency, keyId, membership } = res.data;

      // Razorpay checkout options
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: "HealthHub",
        description: `${membership.title} - ${membership.duration} Month${membership.duration > 1 ? "s" : ""
          }`,
        order_id: orderId,
        handler: function (response) {
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
          membershipPlanId: membershipPlanId,
        },
        theme: {
          color: "#FFD700",
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
    } catch (e) {
      toast.error(e.response?.data?.message || "Razorpay init failed");
      setLoading(false);
    }
  };

  const submitBank = async (referenceNumber, note) => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        toast.error("Login required");
        navigate("/login");
        return;
      }
      await http.post(
        "/bank-transfer/submit",
        { membershipPlanId, withPersonalTrainer, referenceNumber, note }
      );
      toast.success("Bank transfer submitted. We'll verify and notify you.");
      navigate("/profile");
    } catch (e) {
      toast.error(e.response?.data?.message || "Bank transfer submit failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stripe-payment-container">
      <div className="payment-header">
        <h1>Checkout</h1>
        <p className="payment-subtitle">Choose your payment method</p>
      </div>

      <div className="payment-content">
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

        <div className="payment-method-card">
          <h2>Payment Method</h2>
          <div
            style={{
              display: "flex",
              gap: 12,
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
            <button
              className={`back-btn ${method === "stripe" ? "selected" : ""}`}
              onClick={() => setMethod("stripe")}
            >
              Stripe (Cards/UPI)
            </button>
            <button
              className={`back-btn ${method === "razorpay" ? "selected" : ""}`}
              onClick={() => setMethod("razorpay")}
            >
              Razorpay (UPI/Cards)
            </button>
            <button
              className={`back-btn ${method === "bank" ? "selected" : ""}`}
              onClick={() => setMethod("bank")}
            >
              Bank Transfer
            </button>
          </div>

          {method === "stripe" && (
            <div style={{ color: "#ccc" }}>
              <p>
                Pay securely via Stripe Checkout. Supports cards, UPI, and
                wallets.
              </p>
              <p
                style={{
                  color: "#ffc107",
                  fontSize: "0.9rem",
                  marginTop: "0.5rem",
                }}
              >
                ⚠️ Test Mode: Use test payment methods only
              </p>
              <div className="payment-actions">
                <button
                  className="back-btn"
                  onClick={() => navigate("/membership-plan")}
                >
                  ← Back
                </button>
                <button
                  className="pay-btn"
                  onClick={startStripe}
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Pay with Stripe"}{" "}
                  <span className="arrow">→</span>
                </button>
              </div>
            </div>
          )}

          {method === "razorpay" && (
            <div style={{ color: "#ccc" }}>
              <p>
                Pay securely via Razorpay. Supports UPI, Cards, Wallets & Net
                Banking.
              </p>
              <p
                style={{
                  color: "#ffc107",
                  fontSize: "0.9rem",
                  marginTop: "0.5rem",
                }}
              >
                ⚠️ Test Mode: Use test payment methods only
              </p>
              <div className="payment-actions">
                <button
                  className="back-btn"
                  onClick={() => navigate("/membership-plan")}
                >
                  ← Back
                </button>
                <button
                  className="pay-btn"
                  onClick={startRazorpay}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-small"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      Pay with Razorpay
                      <span className="arrow">→</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {method === "bank" && (
            <BankTransferForm onSubmit={submitBank} loading={loading} />
          )}
        </div>

        <div className="security-notice">
          <p>🔒 Payments are secure. We never store your card details.</p>
        </div>
      </div>
    </div>
  );
};

const BankTransferForm = ({ onSubmit, loading }) => {
  const [referenceNumber, setReferenceNumber] = useState("");
  const [note, setNote] = useState("");

  return (
    <div>
      <div style={{ color: "#eee", marginBottom: 12 }}>
        Transfer to account: HealthHub Pvt Ltd, HDFC Bank, A/C 1234567890, IFSC
        HDFC000000
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        <input
          placeholder="Reference Number"
          value={referenceNumber}
          onChange={(e) => setReferenceNumber(e.target.value)}
          style={{
            padding: 12,
            borderRadius: 8,
            border: "1px solid #3a3a4a",
            background: "#1e1e2f",
            color: "#fff",
          }}
        />
        <input
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{
            padding: 12,
            borderRadius: 8,
            border: "1px solid #3a3a4a",
            background: "#1e1e2f",
            color: "#fff",
          }}
        />
      </div>
      <div className="payment-actions" style={{ marginTop: 16 }}>
        <button className="back-btn" onClick={() => window.history.back()}>
          ← Back
        </button>
        <button
          className="pay-btn"
          onClick={() => onSubmit(referenceNumber, note)}
          disabled={loading || !referenceNumber}
        >
          {loading ? "Submitting..." : "Submit Transfer Details"}
        </button>
      </div>
    </div>
  );
};

export default CheckoutPage;
