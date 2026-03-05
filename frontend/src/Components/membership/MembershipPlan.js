import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../css/MembershipPlan.css";
import { http } from "../../api/http";

const MembershipPlan = () => {
  const [membershipPlans, setMembershipPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(3);
  const [withPersonalTrainer, setWithPersonalTrainer] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const navigate = useNavigate(); // Initialize useNavigate hook

  useEffect(() => {
    const fetchMembershipPlans = async () => {
      try {
        const response = await http.get("/membership-plans");
        setMembershipPlans(response.data);
      } catch (error) {
        console.error("Error fetching membership plans:", error);
      }
    };

    fetchMembershipPlans();
  }, []);

  // Get unique durations
  const uniqueDurations = [
    ...new Set(membershipPlans.map((plan) => plan.duration)),
  ];

  // When a duration is selected, pick the first matching plan (you can enhance this later)
  const handleDurationSelect = (duration) => {
    const plan = membershipPlans.find((p) => p.duration === duration);
    if (plan) {
      setSelectedPlan(plan);
      setSelectedDuration(duration);
      setWithPersonalTrainer(false);
    }
  };

  const handlePersonalTrainerToggle = () => {
    setWithPersonalTrainer(!withPersonalTrainer);
  };

  // Calculate total price with discount
  const calculateTotalPrice = (plan, withPT) => {
    if (!plan) return 0;

    let basePrice = plan.price;

    // Add personal trainer charge if selected
    if (withPT && plan.personalTrainerCharge) {
      basePrice += plan.personalTrainerCharge;
    }

    // Apply discount if exists
    if (plan.discount) {
      const discountStr = plan.discount.toString().trim();
      const hasPercent = discountStr.includes("%");
      const numericValue = parseFloat(discountStr.replace(/[^0-9.]/g, ""));

      if (!isNaN(numericValue)) {
        if (hasPercent) {
          // Percentage discount (e.g., "5%", "5% off")
          basePrice = basePrice * (1 - numericValue / 100);
        } else {
          // If no % symbol, check if it's likely a percentage (small number) or fixed amount
          // If value is <= 100, assume it's a percentage (common discount range: 5%, 10%, 20%, etc.)
          // If value is > 100, assume it's a fixed amount in rupees
          if (numericValue <= 100) {
            // Treat as percentage
            basePrice = basePrice * (1 - numericValue / 100);
          } else {
            // Treat as fixed amount
            basePrice = Math.max(0, basePrice - numericValue);
          }
        }
      }
    }

    return Math.round(basePrice * 100) / 100; // Round to 2 decimal places
  };

  const totalPrice = calculateTotalPrice(selectedPlan, withPersonalTrainer);

  const handleSubscribe = async () => {
    try {
      setIsCreating(true);

      // Get auth token
      const authToken = JSON.parse(localStorage.getItem("auth") || "null");
      if (!authToken) {
        toast.error("Please login to subscribe");
        navigate("/login");
        return;
      }

      // Get current user ID
      const userResponse = await http.get("/auth/me");
      const userId = userResponse.data._id;

      // Don't create UserMembership yet - pass plan details to checkout
      // UserMembership will be created ONLY after successful payment
      navigate("/checkout", {
        state: {
          userId,
          membershipPlanId: selectedPlan._id,
          selectedPlan,
          totalPrice,
          withPersonalTrainer,
        },
      });
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.response?.data?.message || "Failed to proceed");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="membership-container">
      <h1 class="membership-heading">Select Your Membership</h1>
      <div className="membership-options">
        {uniqueDurations.map((duration) => (
          <button
            key={duration}
            onClick={() => handleDurationSelect(duration)}
            className="membership-btn"
          >
            {duration} Month{duration > 1 ? "s" : ""}
          </button>
        ))}
      </div>

      {selectedPlan ? (
        <div className="membership-details">
          <h2>{selectedPlan.title}</h2>
          <p>{selectedPlan.description}</p>
          <p>
            <strong>Price: ₹{totalPrice}</strong>
          </p>
          <p>
            <strong>
              Duration: {selectedDuration} month
              {selectedDuration > 1 ? "s" : ""}
            </strong>
          </p>

          {selectedPlan.discount && (
            <p>
              <strong>Discount: {selectedPlan.discount} off</strong>
            </p>
          )}

          <h3>Benefits:</h3>
          <ul type="none">
            {selectedPlan.benefits.map((benefit, index) => (
              <li key={index}>✓ {benefit}</li>
            ))}
          </ul>

          <div className="personal-trainer">
            <button
              onClick={handlePersonalTrainerToggle}
              className={`personal-trainer-btn ${withPersonalTrainer ? "selected" : ""
                }`}
            >
              {withPersonalTrainer
                ? "Remove Personal Trainer"
                : `Add Personal Trainer (+₹${selectedPlan.personalTrainerCharge})`}
            </button>
          </div>

          <button
            className="subscribe-btn"
            onClick={handleSubscribe}
            disabled={isCreating}
          >
            {isCreating ? "Creating Membership..." : "Subscribe Now"}
          </button>
        </div>
      ) : (
        <div className="membership-details-placeholder">
          <p style={{ color: "#333" }}>
            Please select a membership duration to see the details.
          </p>
        </div>
      )}
    </div>
  );
};

export default MembershipPlan;
