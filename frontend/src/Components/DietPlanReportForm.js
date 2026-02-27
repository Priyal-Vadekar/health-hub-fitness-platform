import React, { useState } from "react";
import { http } from "../api/http";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../css/DietPlan.css";

const DietPlanReportForm = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    weight: "",
    height: "",
    goal: "",
    dietType: "",
    allergies: "",
    foodDislikes: "",
    medicalNotes: ""
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.weight || parseFloat(formData.weight) <= 0) {
      newErrors.weight = "Please enter a valid weight";
    }
    if (!formData.height || parseFloat(formData.height) <= 0) {
      newErrors.height = "Please enter a valid height";
    }
    if (!formData.goal) {
      newErrors.goal = "Please select a goal";
    }
    if (!formData.dietType) {
      newErrors.dietType = "Please select a diet type";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly");
      return;
    }

    try {
      setLoading(true);
      const response = await http.post("/diet-plan-requests", {
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),
        goal: formData.goal,
        dietType: formData.dietType,
        allergies: formData.allergies || "",
        foodDislikes: formData.foodDislikes || "",
        medicalNotes: formData.medicalNotes || ""
      });

      if (response.data.success) {
        toast.success("Diet plan request submitted successfully! A dietitian will review and assign a plan.");
        setFormData({
          weight: "",
          height: "",
          goal: "",
          dietType: "",
          allergies: "",
          foodDislikes: "",
          medicalNotes: ""
        });
        onClose();
      } else {
        toast.error(response.data.message || "Failed to submit request");
      }
    } catch (error) {
      console.error("Error submitting diet plan request:", error);
      toast.error(error.response?.data?.message || "Failed to submit diet plan request");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null; // modal hidden when not open

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>
        <h2 className="modal-title">Search Your Diet Plan</h2>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Weight (kg)</label>
            <input
              type="number"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Height (cm)</label>
            <input
              type="number"
              name="height"
              value={formData.height}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Goal</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="goal"
                  value="loss"
                  onChange={handleChange}
                  checked={formData.goal === "loss"}
                  required
                />
                Loss Weight
              </label>
              <label>
                <input
                  type="radio"
                  name="goal"
                  value="gain"
                  onChange={handleChange}
                  checked={formData.goal === "gain"}
                />
                Gain Weight
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Diet Type</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="dietType"
                  value="veg"
                  onChange={handleChange}
                  checked={formData.dietType === "veg"}
                  required
                />
                Vegetarian
              </label>
              <label>
                <input
                  type="radio"
                  name="dietType"
                  value="nonveg"
                  onChange={handleChange}
                  checked={formData.dietType === "nonveg"}
                />
                Non-Vegetarian
              </label>
            </div>
            {errors.dietType && <span className="error-text">{errors.dietType}</span>}
          </div>

          <div className="form-group">
            <label>Allergies (Optional)</label>
            <input
              type="text"
              name="allergies"
              value={formData.allergies}
              onChange={handleChange}
              placeholder="e.g., Nuts, Dairy"
            />
          </div>

          <div className="form-group">
            <label>Food Dislikes (Optional)</label>
            <input
              type="text"
              name="foodDislikes"
              value={formData.foodDislikes}
              onChange={handleChange}
              placeholder="e.g., Spicy food, Seafood"
            />
          </div>

          <div className="form-group">
            <label>Medical Notes (Optional)</label>
            <textarea
              name="medicalNotes"
              value={formData.medicalNotes}
              onChange={handleChange}
              placeholder="Any medical conditions or notes..."
              rows="3"
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Submitting..." : "Submit Request"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DietPlanReportForm;
