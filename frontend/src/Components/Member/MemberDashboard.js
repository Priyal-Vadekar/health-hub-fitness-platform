// frontend/src/Components/Member/MemberDashboard.js
import React, { useState, useEffect } from "react";
import { http } from "../../api/http";
import {
  FiEdit2, FiTrash2, FiCheck, FiX, FiArrowRight,
  FiAward, FiUserCheck
} from "react-icons/fi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../css/MemberDashboard.css";
import { useNavigate } from "react-router-dom";
import DietPlanReportForm from "../DietPlanReportForm";

// ── Inline ProgressTracking (Bug 03) ─────────────────────────────────────────
// Import the actual ProgressTracking component so it renders inside the dashboard
// tab without navigating away. It already has its own Layout wrapper — we render
// it directly and it will work as an embedded view.
import ProgressTrackingPage from "../profile/ProgressTracking";

// ── Inline MealLogging Tab ────────────────────────────────────────────────────
const MealLoggingTab = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [dietPlanMeals, setDietPlanMeals] = useState(null);
  const [mealLog, setMealLog] = useState({ _id: null, meals: [] });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMeal, setNewMeal] = useState({ name: "", time: "", timeOfDay: "Breakfast", calories: 0, notes: "" });
  const [saving, setSaving] = useState(false);

  // ── Inline edit state: key = meal._id, value = edited fields ─────────────
  // Each meal row has its own "edit mode" toggled independently.
  // editMode = { [mealId]: true/false }
  // editData = { [mealId]: { name, time, timeOfDay, calories, macros, notes } }
  const [editMode, setEditMode] = useState({});
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchDietPlanMeals();
    fetchMealLog();
  }, [selectedDate]);

  const fetchDietPlanMeals = async () => {
    try {
      const res = await http.get("/meal-logs/diet-plan-meals", { params: { date: selectedDate } });
      if (res.data.success) setDietPlanMeals(res.data.data);
    } catch (e) { console.error("Diet plan meals error:", e); }
  };

  const fetchMealLog = async () => {
    try {
      const res = await http.get(`/meal-logs/date/${selectedDate}`);
      if (res.data.success) setMealLog(res.data.data || { _id: null, meals: [] });
    } catch (e) { console.error("Meal log error:", e); }
  };

  const handleCheckMeal = async (mealName, timeOfDay) => {
    try {
      const times = { Breakfast: "08:00", Lunch: "12:30", Dinner: "19:00", Snack: "15:00", "Early Morning": "06:00" };
      const time = times[timeOfDay] || "12:00";
      const res = await http.post("/meal-logs", {
        name: mealName, time, timeOfDay, date: selectedDate,
        isFromPlan: true, dietPlanId: dietPlanMeals?.dietPlanId || null, calories: 0
      });
      if (res.data.success) { toast.success(`${mealName} logged!`); fetchMealLog(); fetchDietPlanMeals(); }
    } catch (e) { toast.error(e.response?.data?.message || "Failed to log meal"); }
  };

  const handleUncheckMeal = async (mealName) => {
    if (!mealLog?._id) return;
    const meal = mealLog.meals.find(m => m.name.toLowerCase() === mealName.toLowerCase() && m.isFromPlan);
    if (!meal) return;
    try {
      const res = await http.delete(`/meal-logs/${mealLog._id}/meal/${meal._id}`);
      if (res.data.success) { fetchMealLog(); fetchDietPlanMeals(); }
    } catch (e) { toast.error("Failed to remove meal"); }
  };

  const handleAddCustomMeal = async () => {
    if (!newMeal.name || !newMeal.time) { toast.error("Name and time are required"); return; }
    try {
      setSaving(true);
      const res = await http.post("/meal-logs", { ...newMeal, date: selectedDate, isFromPlan: false, isCustom: true });
      if (res.data.success) {
        toast.success("Custom meal added!");
        setShowAddModal(false);
        setNewMeal({ name: "", time: "", timeOfDay: "Breakfast", calories: 0, notes: "" });
        fetchMealLog();
      }
    } catch (e) { toast.error(e.response?.data?.message || "Failed to add meal"); }
    finally { setSaving(false); }
  };

  // ── Toggle inline edit mode for a specific meal ────────────────────────────
  const toggleEditMode = (meal) => {
    const mid = meal._id;
    if (editMode[mid]) {
      // Cancel — close without saving
      setEditMode(prev => ({ ...prev, [mid]: false }));
      setEditData(prev => { const n = { ...prev }; delete n[mid]; return n; });
    } else {
      // Open — seed editData from current meal values
      setEditMode(prev => ({ ...prev, [mid]: true }));
      setEditData(prev => ({
        ...prev,
        [mid]: {
          name: meal.name,
          time: meal.time,
          timeOfDay: meal.timeOfDay,
          calories: meal.calories || 0,
          macros: { protein: meal.macros?.protein || 0, carbs: meal.macros?.carbs || 0, fats: meal.macros?.fats || 0 },
          notes: meal.notes || ""
        }
      }));
    }
  };

  // ── Save inline edit ────────────────────────────────────────────────────────
  const handleSaveEdit = async (meal) => {
    const mid = meal._id;
    const data = editData[mid];
    if (!data?.name || !data?.time) { toast.error("Name and time are required"); return; }
    try {
      const res = await http.put(`/meal-logs/${mealLog._id}/meal/${mid}`, data);
      if (res.data.success) {
        toast.success("Meal updated!");
        setEditMode(prev => ({ ...prev, [mid]: false }));
        setEditData(prev => { const n = { ...prev }; delete n[mid]; return n; });
        fetchMealLog();
        fetchDietPlanMeals();
      }
    } catch (e) { toast.error(e.response?.data?.message || "Failed to update meal"); }
  };

  const handleDeleteMeal = async (mealId) => {
    if (!mealLog?._id) return;
    try {
      const res = await http.delete(`/meal-logs/${mealLog._id}/meal/${mealId}`);
      if (res.data.success) { fetchMealLog(); fetchDietPlanMeals(); }
    } catch (e) { toast.error("Failed to delete meal"); }
  };

  const totals = (mealLog?.meals || []).reduce((acc, m) => {
    acc.calories += m.calories || 0; return acc;
  }, { calories: 0 });

  const inputStyle = { background: "#1a1a2e", border: "1px solid #555", color: "#fff", padding: "6px 10px", borderRadius: 5, fontSize: "0.82rem", width: "100%" };

  return (
    <div className="meal-logging-dashboard">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ color: "#FFD700", margin: 0 }}>Daily Meal Log</h2>
        <div>
          <label style={{ color: "#ccc", marginRight: 8 }}>Date:</label>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            style={{ background: "#2a2a3b", border: "1px solid #444", color: "#fff", padding: "6px 10px", borderRadius: 6 }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* LEFT — Diet Plan Checklist */}
        <div style={{ background: "#1e1e2e", borderRadius: 12, padding: "1.5rem" }}>
          <h3 style={{ color: "#FFD700", marginBottom: "1rem" }}>Your Diet Plan Meals</h3>
          {!dietPlanMeals?.hasPlan ? (
            <p style={{ color: "#888" }}>No diet plan assigned yet.</p>
          ) : (
            dietPlanMeals.meals.map((group, gi) => (
              <div key={gi} style={{ marginBottom: "1rem" }}>
                <h4 style={{ color: "#FFD700", fontSize: "0.9rem", marginBottom: "0.5rem" }}>{group.timeOfDay}</h4>
                {group.items.map((item, ii) => (
                  <div key={ii} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <input type="checkbox" checked={item.isLogged}
                      onChange={() => item.isLogged ? handleUncheckMeal(item.name) : handleCheckMeal(item.name, group.timeOfDay)}
                      style={{ cursor: "pointer", width: 16, height: 16 }} />
                    <span style={{ color: item.isLogged ? "#28a745" : "#ccc", textDecoration: item.isLogged ? "line-through" : "none", fontSize: "0.9rem" }}>
                      {item.name}
                    </span>
                    {item.isLogged && <FiCheck size={12} style={{ color: "#28a745" }} />}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        {/* RIGHT — Today's Meals with inline edit */}
        <div style={{ background: "#1e1e2e", borderRadius: 12, padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ color: "#FFD700", margin: 0 }}>Today's Meals</h3>
            <button onClick={() => setShowAddModal(true)}
              style={{ background: "#FFD700", color: "#1e1e2f", border: "none", padding: "8px 16px", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: "0.85rem" }}>
              + Add Custom Meal
            </button>
          </div>

          {(!mealLog?.meals || mealLog.meals.length === 0) ? (
            <p style={{ color: "#666", textAlign: "center", marginTop: "2rem" }}>No meals logged for this date yet.</p>
          ) : (
            <>
              {mealLog.meals.map((meal, i) => {
                const mid = meal._id;
                const isEditing = editMode[mid];
                const ed = editData[mid] || {};

                return (
                  <div key={i} style={{ background: "#2a2a3b", borderRadius: 8, marginBottom: 8, overflow: "hidden" }}>
                    {/* ── Meal Row ── */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px" }}>
                      <div>
                        <div style={{ color: "#fff", fontWeight: 600, fontSize: "0.9rem" }}>{meal.name}</div>
                        <div style={{ color: "#aaa", fontSize: "0.78rem" }}>
                          {meal.time} · {meal.timeOfDay}
                          {meal.calories > 0 && ` · ${meal.calories} cal`}
                          {meal.isFromPlan && <span style={{ marginLeft: 6, background: "#1a3a1a", color: "#28a745", padding: "1px 6px", borderRadius: 4, fontSize: "0.7rem" }}>Plan</span>}
                          {meal.isCustom && <span style={{ marginLeft: 6, background: "#1a1a3a", color: "#5b9bd5", padding: "1px 6px", borderRadius: 4, fontSize: "0.7rem" }}>Custom</span>}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {/* ── Edit Mode Toggle Button ── */}
                        <button onClick={() => toggleEditMode(meal)}
                          style={{ background: isEditing ? "#555" : "#FFD700", color: isEditing ? "#fff" : "#1e1e2f", border: "none", padding: "5px 10px", borderRadius: 5, cursor: "pointer", fontWeight: "bold", fontSize: "0.78rem" }}>
                          {isEditing ? <><FiX size={13} style={{ marginRight: 4 }} />Cancel</> : <><FiEdit2 size={13} style={{ marginRight: 4 }} />Edit</>}
                        </button>
                        <button onClick={() => handleDeleteMeal(mid)}
                          style={{ background: "transparent", border: "none", color: "#dc3545", cursor: "pointer", fontSize: "1.1rem", lineHeight: 1, padding: "4px 8px" }}>×</button>
                      </div>
                    </div>

                    {/* ── Inline Edit Form (expands below row when editing) ── */}
                    {isEditing && (
                      <div style={{ borderTop: "1px solid #3a3a4a", padding: "12px 14px", background: "#252535" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                          <div>
                            <label style={{ color: "#aaa", fontSize: "0.75rem", display: "block", marginBottom: 3 }}>Meal Name</label>
                            <input style={inputStyle} value={ed.name || ""}
                              onChange={e => setEditData(prev => ({ ...prev, [mid]: { ...prev[mid], name: e.target.value } }))} />
                          </div>
                          <div>
                            <label style={{ color: "#aaa", fontSize: "0.75rem", display: "block", marginBottom: 3 }}>Time</label>
                            <input type="time" style={inputStyle} value={ed.time || ""}
                              onChange={e => setEditData(prev => ({ ...prev, [mid]: { ...prev[mid], time: e.target.value } }))} />
                          </div>
                          <div>
                            <label style={{ color: "#aaa", fontSize: "0.75rem", display: "block", marginBottom: 3 }}>Meal Type</label>
                            <select style={inputStyle} value={ed.timeOfDay || "Breakfast"}
                              onChange={e => setEditData(prev => ({ ...prev, [mid]: { ...prev[mid], timeOfDay: e.target.value } }))}>
                              <option>Breakfast</option><option>Lunch</option><option>Dinner</option><option>Snack</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ color: "#aaa", fontSize: "0.75rem", display: "block", marginBottom: 3 }}>Calories</label>
                            <input type="number" style={inputStyle} value={ed.calories || 0}
                              onChange={e => setEditData(prev => ({ ...prev, [mid]: { ...prev[mid], calories: parseInt(e.target.value) || 0 } }))} />
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                          {[["Protein (g)", "protein"], ["Carbs (g)", "carbs"], ["Fats (g)", "fats"]].map(([label, key]) => (
                            <div key={key}>
                              <label style={{ color: "#aaa", fontSize: "0.75rem", display: "block", marginBottom: 3 }}>{label}</label>
                              <input type="number" style={inputStyle} value={ed.macros?.[key] || 0}
                                onChange={e => setEditData(prev => ({ ...prev, [mid]: { ...prev[mid], macros: { ...prev[mid].macros, [key]: parseFloat(e.target.value) || 0 } } }))} />
                            </div>
                          ))}
                        </div>
                        <div style={{ marginBottom: 10 }}>
                          <label style={{ color: "#aaa", fontSize: "0.75rem", display: "block", marginBottom: 3 }}>Notes</label>
                          <input style={inputStyle} value={ed.notes || ""}
                            onChange={e => setEditData(prev => ({ ...prev, [mid]: { ...prev[mid], notes: e.target.value } }))} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                          <button onClick={() => toggleEditMode(meal)}
                            style={{ background: "#444", color: "#fff", border: "none", padding: "7px 16px", borderRadius: 5, cursor: "pointer", fontSize: "0.85rem" }}>Cancel</button>
                          <button onClick={() => handleSaveEdit(meal)}
                            style={{ background: "#28a745", color: "#fff", border: "none", padding: "7px 16px", borderRadius: 5, cursor: "pointer", fontWeight: "bold", fontSize: "0.85rem" }}>Save Changes</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <div style={{ marginTop: "1rem", padding: "10px 14px", background: "#2a2a3b", borderRadius: 8, color: "#aaa", fontSize: "0.85rem" }}>
                Total: <strong style={{ color: "#FFD700" }}>{totals.calories} cal</strong>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Custom Meal Modal */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setShowAddModal(false)}>
          <div style={{ background: "#1e1e2e", borderRadius: 12, padding: "2rem", width: 400, maxWidth: "90vw" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <h3 style={{ color: "#FFD700", margin: 0 }}>Add Custom Meal</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", color: "#fff", fontSize: "1.5rem", cursor: "pointer" }}>×</button>
            </div>
            {[["Meal Name *", "text", "name", "e.g. Grilled Chicken"], ["Time *", "time", "time", ""], ["Calories", "number", "calories", "0"]].map(([label, type, field, ph]) => (
              <div key={field} style={{ marginBottom: "1rem" }}>
                <label style={{ color: "#ccc", display: "block", marginBottom: 4, fontSize: "0.85rem" }}>{label}</label>
                <input type={type} value={newMeal[field]} placeholder={ph}
                  onChange={e => setNewMeal({ ...newMeal, [field]: type === "number" ? parseInt(e.target.value) || 0 : e.target.value })}
                  style={{ width: "100%", background: "#2a2a3b", border: "1px solid #444", color: "#fff", padding: "8px 12px", borderRadius: 6 }} />
              </div>
            ))}
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ color: "#ccc", display: "block", marginBottom: 4, fontSize: "0.85rem" }}>Meal Type</label>
              <select value={newMeal.timeOfDay} onChange={e => setNewMeal({ ...newMeal, timeOfDay: e.target.value })}
                style={{ width: "100%", background: "#2a2a3b", border: "1px solid #444", color: "#fff", padding: "8px 12px", borderRadius: 6 }}>
                <option>Breakfast</option><option>Lunch</option><option>Dinner</option><option>Snack</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: "1.5rem" }}>
              <button onClick={() => setShowAddModal(false)} style={{ flex: 1, background: "#444", color: "#fff", border: "none", padding: "10px", borderRadius: 6, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleAddCustomMeal} disabled={saving} style={{ flex: 2, background: "#FFD700", color: "#1e1e2f", border: "none", padding: "10px", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: "1rem" }}>
                {saving ? "Adding..." : "Add Meal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Trainer Booking Modal (inline — no redirect) ──────────────────────────────
const TrainerBookingModal = ({ onClose, onBooked }) => {
  const navigate = useNavigate();
  const [trainers, setTrainers] = useState([]);
  const [selectedTrainerId, setSelectedTrainerId] = useState("");
  const [trainer, setTrainer] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const hourlyRate = 1000;

  useEffect(() => { fetchTrainers(); }, []);

  useEffect(() => {
    if (selectedTrainerId) {
      fetchTrainerDetails(selectedTrainerId);
      fetchSlots(selectedTrainerId, selectedDate);
    } else {
      setTrainer(null);
      setAvailableSlots([]);
    }
  }, [selectedTrainerId, selectedDate]);

  const fetchTrainers = async () => {
    try {
      const res = await http.get("/staff/trainers");
      setTrainers(res.data.data || []);
    } catch (e) { console.error("Fetch trainers error:", e); }
  };

  const fetchTrainerDetails = async (id) => {
    try {
      const res = await http.get(`/users/${id}`);
      if (res.data.success) setTrainer(res.data.data);
    } catch (e) { console.error("Trainer details error:", e); }
  };

  const fetchSlots = async (tid, date) => {
    try {
      const res = await http.get("/bookings/available-slots", { params: { trainerId: tid, date } });
      if (res.data.success) setAvailableSlots(res.data.data);
    } catch (e) { setAvailableSlots([]); }
  };

  const handleBook = async () => {
    if (!selectedTrainerId || !selectedSlot) { toast.error("Select a trainer and time slot"); return; }
    try {
      setLoading(true);
      const res = await http.post("/bookings", {
        trainerId: selectedTrainerId,
        date: selectedDate,
        timeSlot: selectedSlot,
        sessionPrice: hourlyRate,
      });
      if (res.data.success) {
        const booking = res.data.data;
        toast.success("Booking created! Redirecting to payment...");
        onClose();
        navigate("/trainer-checkout", {
          state: {
            bookingId: booking._id,
            amount: hourlyRate,
            trainerId: selectedTrainerId,
            trainerName: trainer?.name || "Trainer",
            date: selectedDate,
            timeSlot: selectedSlot,
            booking
          }
        });
        if (onBooked) onBooked();
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to create booking");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}>
      <div style={{ background: "#1e1e2e", borderRadius: 16, padding: "2rem", width: 560, maxWidth: "92vw", maxHeight: "90vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ color: "#FFD700", margin: 0 }}>Book Trainer Session</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", fontSize: "1.8rem", cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        {/* Trainer Dropdown */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ color: "#FFD700", display: "block", marginBottom: 6, fontWeight: "bold" }}>Select Trainer</label>
          <select value={selectedTrainerId} onChange={e => { setSelectedTrainerId(e.target.value); setSelectedSlot(null); }}
            style={{ width: "100%", background: "#2a2a3b", border: "1px solid #555", color: "#fff", padding: "10px 14px", borderRadius: 8, fontSize: "0.95rem" }}>
            <option value="">-- Choose a Trainer --</option>
            {trainers.map(t => (
              <option key={t._id} value={t.user?._id || t._id}>
                {t.user?.name || "Trainer"} {t.specialty ? `· ${t.specialty}` : ""}
              </option>
            ))}
          </select>
        </div>

        {trainer && (
          <div style={{ background: "#2a2a3b", borderRadius: 10, padding: "12px 16px", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: 12 }}>
            <div>
              <div style={{ color: "#fff", fontWeight: "bold" }}>{trainer.name}</div>
              {trainer.isCertified && <span style={{ background: "#28a745", color: "#fff", padding: "2px 8px", borderRadius: 4, fontSize: "0.75rem" }}>✔ Certified</span>}
              <div style={{ color: "#aaa", fontSize: "0.85rem", marginTop: 4 }}>Hourly Rate: ₹{hourlyRate}/hour</div>
            </div>
          </div>
        )}

        {/* Date Picker */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ color: "#FFD700", display: "block", marginBottom: 6, fontWeight: "bold" }}>Date</label>
          <input type="date" value={selectedDate} min={new Date().toISOString().split("T")[0]}
            onChange={e => { setSelectedDate(e.target.value); setSelectedSlot(null); }}
            style={{ width: "100%", background: "#2a2a3b", border: "1px solid #555", color: "#fff", padding: "10px 14px", borderRadius: 8 }} />
        </div>

        {/* Time Slots */}
        {selectedTrainerId && (
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ color: "#FFD700", display: "block", marginBottom: 10, fontWeight: "bold" }}>Available Time Slots</label>
            {availableSlots.length === 0 ? (
              <p style={{ color: "#888" }}>No available slots for this date.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {availableSlots.map((slot, i) => (
                  <button key={i} onClick={() => setSelectedSlot(slot)}
                    style={{ background: selectedSlot?.start === slot.start ? "#FFD700" : "#2a2a3b", color: selectedSlot?.start === slot.start ? "#1e1e2f" : "#fff", border: `1px solid ${selectedSlot?.start === slot.start ? "#FFD700" : "#444"}`, borderRadius: 6, padding: "8px 4px", cursor: "pointer", fontSize: "0.82rem", fontWeight: selectedSlot?.start === slot.start ? "bold" : "normal" }}>
                    {slot.start} – {slot.end}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Booking Summary */}
        {selectedSlot && (
          <div style={{ background: "#2a2a3b", borderRadius: 10, padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
            <h4 style={{ color: "#FFD700", marginBottom: 10 }}>Booking Summary</h4>
            {[["Trainer", trainer?.name || "—"], ["Date", new Date(selectedDate).toLocaleDateString()], ["Time", `${selectedSlot.start} – ${selectedSlot.end}`], ["Duration", "1 hour"]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", color: "#ccc", fontSize: "0.9rem", marginBottom: 6 }}>
                <span>{k}:</span><span style={{ color: "#fff" }}>{v}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", color: "#FFD700", fontWeight: "bold", fontSize: "1rem", borderTop: "1px solid #444", paddingTop: 10, marginTop: 8 }}>
              <span>Total:</span><span>₹{hourlyRate}</span>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, background: "#444", color: "#fff", border: "none", padding: "12px", borderRadius: 8, cursor: "pointer" }}>Cancel</button>
          <button onClick={handleBook} disabled={loading || !selectedSlot}
            style={{ flex: 2, background: selectedSlot ? "#FFD700" : "#555", color: selectedSlot ? "#1e1e2f" : "#888", border: "none", padding: "12px", borderRadius: 8, cursor: selectedSlot ? "pointer" : "not-allowed", fontWeight: "bold", fontSize: "1rem" }}>
            {loading ? "Processing..." : <><span>Book &amp; Pay</span><FiArrowRight size={14} style={{ marginLeft: 6 }} /></>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main MemberDashboard ──────────────────────────────────────────────────────
const MemberDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    membershipStatus: "Inactive",
    dietPlanAssigned: false,
    progressEntries: 0,
    mealLogsToday: 0,
    upcomingSessions: 0
  });
  const [currentMembership, setCurrentMembership] = useState(null);
  const [membershipHistory, setMembershipHistory] = useState([]);
  const [myDietPlan, setMyDietPlan] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [trainerSessions, setTrainerSessions] = useState([]);
  const [showDietRequestModal, setShowDietRequestModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      if (activeTab === "overview") await Promise.all([fetchMembership(), fetchDietPlan(), fetchStats()]);
      else if (activeTab === "membership") { await fetchMembership(); await fetchMembershipHistory(); }
      else if (activeTab === "diet-plan") await fetchDietPlan();
      else if (activeTab === "announcements") await fetchAnnouncements();
      else if (activeTab === "trainer-sessions") await fetchTrainerSessions();
    } catch (e) { console.error("Dashboard data error:", e); }
    finally { setLoading(false); }
  };

  const fetchMembership = async () => {
    try {
      const res = await http.get("/user-membership-plans/my-membership");
      if (res.data.success && res.data.data) {
        setCurrentMembership(res.data.data);
        setStats(prev => ({ ...prev, membershipStatus: res.data.data.isActive ? "Active" : "Inactive" }));
      }
    } catch (e) { console.error("Membership error:", e); }
  };

  const fetchMembershipHistory = async () => {
    try {
      const res = await http.get("/user-membership-plans/history");
      if (res.data.success) setMembershipHistory(res.data.data || []);
    } catch (e) { console.error("History error:", e); }
  };

  // ── BUG FIX: Diet Plan "No" even when assigned ───────────────────────────
  // The AssignedDietPlan controller's getMemberDietPlans already populates dietPlan.
  // Old code: fetched /assigned-dietplans/member → got array[0].dietPlan (populated object)
  //           then did a SECOND http call to /diet-plans/:latestPlan.dietPlan
  //           but latestPlan.dietPlan IS already the full object, not an ID → GET /diet-plans/[Object]
  //           → this silently fails → setMyDietPlan(null) → shows "No"
  // Fix: use the already-populated dietPlan directly from the first response.
  const fetchDietPlan = async () => {
    try {
      const res = await http.get("/assigned-dietplans/member");
      // Response is a plain array (not {success, data}) per getMemberDietPlans controller
      const list = Array.isArray(res.data) ? res.data : (res.data.data || []);
      if (list.length > 0 && list[0].dietPlan) {
        const plan = list[0].dietPlan;
        // dietPlan is already populated (full object, not just an ID)
        setMyDietPlan(typeof plan === "object" && plan._id ? plan : null);
        setStats(prev => ({ ...prev, dietPlanAssigned: !!(typeof plan === "object" && plan._id) }));
      } else {
        setMyDietPlan(null);
        setStats(prev => ({ ...prev, dietPlanAssigned: false }));
      }
    } catch (e) {
      console.error("Diet plan error:", e);
      setMyDietPlan(null);
    }
  };

  const fetchStats = async () => {
    try {
      const [progressRes, mealLogsRes, sessionsRes] = await Promise.allSettled([
        http.get("/progress/summary", { params: { days: 30 } }),
        http.get("/meal-logs/date/" + new Date().toISOString().split("T")[0]),
        http.get("/bookings/member")
      ]);
      if (progressRes.status === "fulfilled" && progressRes.value.data.success) {
        setStats(prev => ({ ...prev, progressEntries: progressRes.value.data.data.weight?.length || 0 }));
      }
      if (mealLogsRes.status === "fulfilled" && mealLogsRes.value.data.success) {
        const meals = mealLogsRes.value.data.data?.meals || [];
        setStats(prev => ({ ...prev, mealLogsToday: meals.length }));
      }
      if (sessionsRes.status === "fulfilled" && sessionsRes.value.data.success) {
        const upcoming = (sessionsRes.value.data.data || []).filter(
          s => new Date(s.date) >= new Date() && s.status === "confirmed"
        );
        setStats(prev => ({ ...prev, upcomingSessions: upcoming.length }));
      }
    } catch (e) { console.error("Stats error:", e); }
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await http.get("/announcements/all-announcements", { params: { role: "Member" } });
      const list = res.data.success ? (res.data.data || []) : (Array.isArray(res.data) ? res.data : []);
      const now = new Date();
      setAnnouncements(list.filter(a => a.active && ((now - new Date(a.createdAt || a.date)) / 3600000) >= 24));
    } catch (e) { setAnnouncements([]); }
  };

  const fetchTrainerSessions = async () => {
    try {
      const res = await http.get("/bookings/member");
      if (res.data.success) setTrainerSessions(res.data.data || []);
    } catch (e) { setTrainerSessions([]); }
  };

  const handleCancelMembership = async () => {
    if (!window.confirm("Cancel auto-renewal? Your membership stays active until the end date.")) return;
    try {
      const res = await http.patch(`/user-membership-plans/${currentMembership._id}/cancel`);
      if (res.data.success) { toast.success("Auto-renewal cancelled."); fetchMembership(); }
    } catch (e) { toast.error("Failed to cancel membership"); }
  };

  // FIX: categorise by status not just date — completed sessions always show in Past
  const upcomingSessions = trainerSessions.filter(s => (s.status === 'confirmed' || s.status === 'pending') && new Date(s.date) >= new Date());
  const pastSessions = trainerSessions.filter(s => s.status === 'completed' || s.status === 'cancelled' || new Date(s.date) < new Date());
  return (
    <div>
      <div className="member-dashboard">
        <div className="dashboard-header">
          <h1>Member Dashboard</h1>
          <p>Welcome! Manage your fitness journey from here.</p>
        </div>

        <div className="dashboard-tabs">
          {["overview", "membership", "diet-plan", "progress", "meal-logging", "trainer-sessions", "announcements"].map(tab => (
            <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>
              {tab === "overview" ? "Overview" : tab === "membership" ? "My Membership" : tab === "diet-plan" ? "My Diet Plan" : tab === "progress" ? "Progress Tracking" : tab === "meal-logging" ? "Meal Logging" : tab === "trainer-sessions" ? "Trainer Sessions" : "Announcements"}
            </button>
          ))}
        </div>

        <div className="dashboard-content">
          {/* ── OVERVIEW ─────────────────────────── */}
          {activeTab === "overview" && (
            <div className="overview-tab">
              <div className="stats-grid">
                <div className="stat-card clickable" onClick={() => setActiveTab("membership")}>
                  <h3>{stats.membershipStatus}</h3><p>Membership Status</p>
                </div>
                <div className="stat-card clickable" onClick={() => setActiveTab("diet-plan")}>
                  <h3>{stats.dietPlanAssigned ? "Yes" : "No"}</h3><p>Diet Plan Assigned</p>
                </div>
                <div className="stat-card clickable" onClick={() => setActiveTab("progress")}>
                  <h3>{stats.progressEntries}</h3><p>Progress Entries</p>
                </div>
                <div className="stat-card clickable" onClick={() => setActiveTab("meal-logging")}>
                  <h3>{stats.mealLogsToday}</h3><p>Meals Logged Today</p>
                </div>
                <div className="stat-card clickable" onClick={() => setActiveTab("trainer-sessions")}>
                  <h3>{stats.upcomingSessions}</h3><p>Upcoming Sessions</p>
                </div>
              </div>
              <p style={{ color: "#ccc", marginTop: "20px" }}>Click any card to view details, or select a tab above.</p>
            </div>
          )}

          {/* ── MY MEMBERSHIP ─────────────────────────── */}
          {activeTab === "membership" && (
            <div className="membership-tab">
              <div className="diet-plans-header">
                <h2>My Membership</h2>
                <button className="btn-primary" onClick={() => navigate("/membership-plan")}>
                  {currentMembership?.isActive ? "Renew / Upgrade" : "Buy Membership"}
                </button>
              </div>
              {loading ? <div className="loading">Loading...</div> : currentMembership ? (
                <div className="diet-plan-card">
                  <div className="plan-header">
                    <h3>{currentMembership.membershipPlan?.title || "Membership Plan"}</h3>
                    <span className={`badge ${currentMembership.isActive ? "active-badge" : "inactive-badge"}`}>
                      {currentMembership.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="plan-meals">
                    <p><strong>Start:</strong> {new Date(currentMembership.startDate).toLocaleDateString()}</p>
                    <p><strong>End:</strong> {new Date(currentMembership.endDate).toLocaleDateString()}</p>
                    <p><strong>Price:</strong> ₹{currentMembership.totalPrice}</p>
                    <p><strong>Personal Trainer:</strong> {currentMembership.withPersonalTrainer ? "Yes" : "No"}</p>
                  </div>
                  {currentMembership.isActive && (
                    <div className="plan-actions">
                      <button className="btn-danger" onClick={handleCancelMembership}>Cancel Auto-Renewal</button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No active membership.</p>
                  <button className="btn-primary" onClick={() => navigate("/membership-plan")}>Buy Membership</button>
                </div>
              )}
              {membershipHistory.length > 0 && (
                <div style={{ marginTop: "3rem" }}>
                  <h2>Membership History</h2>
                  <div className="diet-plans-list">
                    {membershipHistory.map(m => (
                      <div key={m._id} className="diet-plan-card">
                        <div className="plan-header">
                          <h3>{m.membershipPlan?.title || "Plan"}</h3>
                          <span className={`badge ${m.isActive ? "active-badge" : "inactive-badge"}`}>{m.isActive ? "Active" : "Expired"}</span>
                        </div>
                        <p><strong>Start:</strong> {new Date(m.startDate).toLocaleDateString()}</p>
                        <p><strong>End:</strong> {new Date(m.endDate).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── MY DIET PLAN ─────────────────────────── */}
          {activeTab === "diet-plan" && (
            <div className="diet-plans-tab">
              <h2>My Diet Plan</h2>
              {loading ? <div className="loading">Loading...</div> : myDietPlan ? (
                <div className="diet-plan-card">
                  <div className="plan-header">
                    <h3>{myDietPlan.category}</h3>
                    <span className="plan-date">Assigned: {new Date(myDietPlan.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="plan-meals">
                    {(myDietPlan.meals || []).map((g, i) => (
                      <div key={i} className="meal-group">
                        <h4>{g.timeOfDay}</h4>
                        <ul>{(g.items || []).map((item, j) => <li key={j}>{item}</li>)}</ul>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <p>No diet plan assigned yet. You can request one below.</p>
                  {/* ── FIX: open DietPlanReportForm popup instead of navigating to /profile */}
                  <button className="btn-primary" onClick={() => setShowDietRequestModal(true)}>
                    Request Diet Plan
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── PROGRESS TRACKING — full component embedded inline (Bug 03) ── */}
          {activeTab === "progress" && <ProgressTrackingPage />}

          {/* ── MEAL LOGGING — embedded inline ─────────────────────────── */}
          {activeTab === "meal-logging" && <MealLoggingTab />}

          {/* ── TRAINER SESSIONS ─────────────────────────── */}
          {activeTab === "trainer-sessions" && (
            <div className="meal-logs-tab">
              <div className="meal-logs-header">
                <h2>My Trainer Sessions</h2>
                {/* ── FIX: opens inline modal with trainer dropdown instead of navigating to /trainer */}
                <button className="btn-primary" onClick={() => setShowBookingModal(true)}>Book New Session</button>
              </div>
              {loading ? <div className="loading">Loading...</div> : trainerSessions.length === 0 ? (
                <div className="empty-state"><p>No trainer sessions booked yet.</p></div>
              ) : (
                <>
                  {upcomingSessions.length > 0 && (
                    <div style={{ marginBottom: "2rem" }}>
                      <h3 style={{ color: "#FFD700" }}>Upcoming Sessions</h3>
                      <div className="meal-logs-list">
                        {upcomingSessions.map(s => (
                          <div key={s._id} className="meal-log-card">
                            <div className="log-header">
                              <h4>{s.trainer?.name || "Trainer"}</h4>
                              <span className={`badge ${s.status === "confirmed" ? "active-badge" : "inactive-badge"}`}>{s.status}</span>
                            </div>
                            <div className="log-meals">
                              <p><strong>Date:</strong> {new Date(s.date).toLocaleDateString()}</p>
                              <p><strong>Time:</strong> {s.timeSlot?.start} – {s.timeSlot?.end}</p>
                              {s.price && <p><strong>Price:</strong> ₹{s.price}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {pastSessions.length > 0 && (
                    <div>
                      <h3 style={{ color: "#aaa" }}>Past Sessions</h3>
                      <div className="meal-logs-list">
                        {pastSessions.map(s => (
                          <div key={s._id} className="meal-log-card" style={{ opacity: 0.7 }}>
                            <div className="log-header">
                              <h4>{s.trainer?.name || "Trainer"}</h4>
                              <span className={`badge ${s.status === "completed" ? "active-badge" : "inactive-badge"}`} style={s.status === "completed" ? { background: "#28a74522", color: "#28a745", border: "1px solid #28a745" } : {}}>{s.status}</span>
                            </div>
                            <p><strong>Date:</strong> {new Date(s.date).toLocaleDateString()}</p>
                            <p><strong>Time:</strong> {s.timeSlot?.start} – {s.timeSlot?.end}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── ANNOUNCEMENTS ─────────────────────────── */}
          {activeTab === "announcements" && (
            <div className="announcements-tab">
              <h2>Announcements</h2>
              {loading ? <div className="loading">Loading...</div> : announcements.length === 0 ? (
                <div className="empty-state"><p>No announcements available.</p></div>
              ) : (
                <div className="announcements-list">
                  {announcements.map(a => (
                    <div key={a._id} className="announcement-card">
                      <div className="announcement-header">
                        <h3>{a.title}</h3>
                        <span className="active-badge">New</span>
                      </div>
                      <p>{a.description}</p>
                      <div className="announcement-meta">
                        <span>{new Date(a.date || a.createdAt).toLocaleDateString()}</span>
                        <span>{a.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Diet Plan Request Popup (same form as /profile → "Search Your Diet Plan") */}
      <DietPlanReportForm
        isOpen={showDietRequestModal}
        onClose={() => setShowDietRequestModal(false)}
      />

      {/* Trainer Booking Modal */}
      {showBookingModal && (
        <TrainerBookingModal
          onClose={() => setShowBookingModal(false)}
          onBooked={() => { setShowBookingModal(false); fetchTrainerSessions(); }}
        />
      )}
    </div>
  );
};

export default MemberDashboard;