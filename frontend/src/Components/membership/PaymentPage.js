import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../css/PaymentPage.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PaymentPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Destructure state with fallback defaults
    const { selectedPlan, totalPrice = 0, withPersonalTrainer = false } = location.state || {};

    // Handle if plan is missing (redirect to membership page)
    useEffect(() => {
        if (!selectedPlan) {
            toast.info("No plan selected. Redirecting...");
            navigate("/payment");
        }
    }, [selectedPlan, navigate]);

    // Always redirect to error page when completing order
    const handleCompleteOrder = () => {
        navigate("/payment-error", {
            state: {
                errorMessage: "Payment gateway failed to initialize due to a server error.",
            },
        });
    };

    return (
        <div className="payment-container">
            <h1>Complete Your Payment</h1>

            {/* Price Summary Section */}
            <div className="price-summary">
                <strong>Plan:</strong> {selectedPlan?.title || "N/A"} <br />
                <strong>Duration:</strong> {selectedPlan?.duration || 0} Month
                {selectedPlan?.duration > 1 ? "s" : ""} <br />
                <strong>Personal Trainer:</strong> {withPersonalTrainer ? "Included" : "Not Included"} <br />
                <strong>Total Price:</strong> ₹{totalPrice}
            </div>

            {/* Dummy Payment Options */}
            <div className="payment-options">
                <label className="payment-option">
                    <input type="radio" name="payment" />
                    Credit Card
                </label>

                <label className="payment-option">
                    <input type="radio" name="payment" />
                    PayPal
                </label>

                <label className="payment-option">
                    <input type="radio" name="payment" />
                    Klarna
                </label>

                <label className="payment-option">
                    <input type="radio" name="payment" />
                    Coinbase Commerce
                </label>
            </div>

            {/* Complete Order Button */}
            <button className="complete-order-btn" onClick={handleCompleteOrder}>
                Complete Order
            </button>
        </div>
    );
};

export default PaymentPage;
