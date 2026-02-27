// frontend/src/Components/profile/MealLogging.js
import React, { useState, useEffect } from "react";
import Layout from "../layout/Layout";
import { http } from "../../api/http";
import { fetchFoodData } from "../../services/nutritionApi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../css/MealLogging.css";

const MealLogging = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dietPlanMeals, setDietPlanMeals] = useState(null);
  const [mealLog, setMealLog] = useState(null);
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [showEditMealModal, setShowEditMealModal] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);
  const [newMeal, setNewMeal] = useState({
    name: "",
    time: "",
    timeOfDay: "Breakfast",
    calories: 0,
    macros: { protein: 0, carbs: 0, fats: 0 },
    notes: ""
  });
  const [foodSearch, setFoodSearch] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDietPlanMeals();
    fetchMealLog();
  }, [selectedDate]);

  const fetchDietPlanMeals = async () => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await http.get("/meal-logs/diet-plan-meals", {
        params: { date: dateStr }
      });
      if (response.data.success) {
        setDietPlanMeals(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching diet plan meals:", error);
    }
  };

  const fetchMealLog = async () => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await http.get(`/meal-logs/date/${dateStr}`);
      if (response.data.success) {
        setMealLog(response.data.data);
      } else {
        setMealLog(null);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setMealLog(null);
      } else {
        console.error("Error fetching meal log:", error);
      }
    }
  };

  const handleCheckMeal = async (mealName, timeOfDay) => {
    try {
      const time = getTimeForMealType(timeOfDay);
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await http.post("/meal-logs", {
        name: mealName,
        time,
        timeOfDay,
        date: dateStr,
        isFromPlan: true,
        dietPlanId: dietPlanMeals?.dietPlanId || null,
        calories: 0,
        macros: { protein: 0, carbs: 0, fats: 0 }
      });

      if (response.data.success) {
        toast.success("Meal logged!");
        fetchMealLog();
        fetchDietPlanMeals();
      }
    } catch (error) {
      console.error("Error logging meal:", error);
      toast.error(error.response?.data?.message || "Failed to log meal");
    }
  };

  const handleSearchFood = async () => {
    if (!foodSearch.trim()) {
      toast.error("Please enter a food item");
      return;
    }

    try {
      setLoading(true);
      const result = await fetchFoodData(foodSearch);
      if (result.error) {
        toast.error(result.error || "API configuration error. Please contact support.");
        setSearchResults(null);
      } else if (result && result.calories > 0) {
        setSearchResults(result);
        setNewMeal({
          ...newMeal,
          name: result.name,
          calories: result.calories,
          macros: {
            protein: result.protein || 0,
            carbs: result.carbs || 0,
            fats: result.fats || 0
          }
        });
      } else {
        toast.error("Food not found. Please try a different search term.");
        setSearchResults(null);
      }
    } catch (error) {
      console.error("Error searching food:", error);
      toast.error("Failed to search food");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomMeal = async () => {
    if (!newMeal.name || !newMeal.time) {
      toast.error("Please fill in meal name and time");
      return;
    }

    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await http.post("/meal-logs", {
        ...newMeal,
        date: dateStr,
        isFromPlan: false,
        isCustom: true
      });

      if (response.data.success) {
        toast.success("Custom meal added!");
        setShowAddMealModal(false);
        setNewMeal({
          name: "",
          time: "",
          timeOfDay: "Breakfast",
          calories: 0,
          macros: { protein: 0, carbs: 0, fats: 0 },
          notes: ""
        });
        setSearchResults(null);
        setFoodSearch("");
        fetchMealLog();
        fetchDietPlanMeals();
      }
    } catch (error) {
      console.error("Error adding custom meal:", error);
      toast.error(error.response?.data?.message || "Failed to add meal");
    }
  };

  const handleEditMeal = (meal, mealLogId) => {
    setEditingMeal({ ...meal, mealLogId });
    setNewMeal({
      name: meal.name,
      time: meal.time,
      timeOfDay: meal.timeOfDay,
      calories: meal.calories || 0,
      macros: meal.macros || { protein: 0, carbs: 0, fats: 0 },
      notes: meal.notes || ""
    });
    setShowEditMealModal(true);
  };

  const handleUpdateMeal = async () => {
    if (!editingMeal || !newMeal.name || !newMeal.time) {
      toast.error("Please fill in meal name and time");
      return;
    }

    try {
      const response = await http.put(`/meal-logs/${editingMeal.mealLogId}/meal/${editingMeal._id}`, {
        name: newMeal.name,
        time: newMeal.time,
        timeOfDay: newMeal.timeOfDay,
        calories: newMeal.calories,
        macros: newMeal.macros,
        notes: newMeal.notes
      });

      if (response.data.success) {
        toast.success("Meal updated!");
        setShowEditMealModal(false);
        setEditingMeal(null);
        setNewMeal({
          name: "",
          time: "",
          timeOfDay: "Breakfast",
          calories: 0,
          macros: { protein: 0, carbs: 0, fats: 0 },
          notes: ""
        });
        setSearchResults(null);
        setFoodSearch("");
        fetchMealLog();
        fetchDietPlanMeals();
      }
    } catch (error) {
      console.error("Error updating meal:", error);
      toast.error(error.response?.data?.message || "Failed to update meal");
    }
  };

  const handleDeleteMeal = async (mealLogId, mealId) => {
    if (!window.confirm("Delete this meal?")) return;

    try {
      const response = await http.delete(`/meal-logs/${mealLogId}/meal/${mealId}`);
      if (response.data.success) {
        toast.success("Meal deleted");
        fetchMealLog();
        fetchDietPlanMeals();
      }
    } catch (error) {
      console.error("Error deleting meal:", error);
      toast.error(error.response?.data?.message || "Failed to delete meal");
    }
  };

  const getTimeForMealType = (timeOfDay) => {
    const times = {
      Breakfast: "08:00",
      Lunch: "12:30",
      Dinner: "19:00",
      Snack: "15:00"
    };
    return times[timeOfDay] || "12:00";
  };

  const calculateTotals = () => {
    if (!mealLog || !mealLog.meals) return { calories: 0, macros: { protein: 0, carbs: 0, fats: 0 } };
    const totals = mealLog.meals.reduce((acc, meal) => {
      acc.calories += meal.calories || 0;
      acc.macros.protein += meal.macros?.protein || 0;
      acc.macros.carbs += meal.macros?.carbs || 0;
      acc.macros.fats += meal.macros?.fats || 0;
      return acc;
    }, { calories: 0, macros: { protein: 0, carbs: 0, fats: 0 } });
    return totals;
  };

  const totals = calculateTotals();

  return (
    <Layout>
      <div className="meal-logging-container">
        <div className="meal-logging-header">
          <h1>Daily Meal Log</h1>
          <div className="date-selector">
            <label>Date: </label>
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        <div className="meal-logging-content">
          {/* Diet Plan Checklist */}
          {dietPlanMeals?.hasPlan && (
            <div className="diet-plan-checklist">
              <h2>Your Diet Plan Meals</h2>
              {dietPlanMeals.meals.map((mealGroup, idx) => (
                <div key={idx} className="meal-group">
                  <h3>{mealGroup.timeOfDay}</h3>
                  <div className="meal-items">
                    {mealGroup.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="meal-item-checkbox">
                        <label>
                          <input
                            type="checkbox"
                            checked={item.isLogged}
                            onChange={() => {
                              if (!item.isLogged) {
                                handleCheckMeal(item.name, mealGroup.timeOfDay);
                              }
                            }}
                            disabled={item.isLogged}
                          />
                          <span className={item.isLogged ? "logged" : ""}>
                            {item.name}
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!dietPlanMeals?.hasPlan && (
            <div className="no-diet-plan" style={{ padding: '2rem', background: '#2a2a3b', borderRadius: '12px', marginBottom: '2rem', textAlign: 'center' }}>
              <p style={{ color: '#ccc', marginBottom: '1rem' }}>No diet plan assigned yet.</p>
              <p style={{ color: '#888', fontSize: '0.9rem' }}>Request a diet plan from your profile page, or add custom meals below.</p>
            </div>
          )}

          {/* Today's Logged Meals */}
          <div className="logged-meals">
            <div className="section-header">
              <h2>Today's Meals</h2>
              <button
                className="add-meal-btn"
                onClick={() => {
                  setShowAddMealModal(true);
                  setSearchResults(null);
                  setFoodSearch("");
                }}
              >
                + Add Custom Meal
              </button>
            </div>

            {mealLog && mealLog.meals && mealLog.meals.length > 0 ? (
              <div className="meals-list">
                {mealLog.meals.map((meal, idx) => (
                  <div key={idx} className="logged-meal-item">
                    <div className="meal-info">
                      <span className="meal-time">{meal.time}</span>
                      <span className="meal-name">{meal.name}</span>
                      <span className="meal-type">{meal.timeOfDay}</span>
                      {meal.isFromPlan && <span className="badge">From Plan</span>}
                      {meal.isCustom && <span className="badge custom">Custom</span>}
                    </div>
                    <div className="meal-nutrition">
                      <span>{meal.calories} cal</span>
                      {meal.macros && (
                        <span>
                          P: {meal.macros.protein}g | C: {meal.macros.carbs}g | F: {meal.macros.fats}g
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="edit-btn"
                        onClick={() => handleEditMeal(meal, mealLog._id)}
                        style={{
                          background: '#FFD700',
                          color: '#1e1e2f',
                          border: 'none',
                          padding: '0.5rem 1rem',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '0.9rem'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteMeal(mealLog._id, meal._id)}
                        style={{
                          background: '#dc3545',
                          color: '#fff',
                          border: 'none',
                          padding: '0.5rem 1rem',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '1.2rem'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
                <div className="daily-totals">
                  <h3>Daily Totals</h3>
                  <p>Calories: {totals.calories}</p>
                  <p>
                    Protein: {totals.macros.protein}g | 
                    Carbs: {totals.macros.carbs}g | 
                    Fats: {totals.macros.fats}g
                  </p>
                </div>
              </div>
            ) : (
              <p className="no-meals">No meals logged for this date yet.</p>
            )}
          </div>
        </div>

        {/* Edit Meal Modal */}
        {showEditMealModal && editingMeal && (
          <div className="modal-overlay" onClick={() => { setShowEditMealModal(false); setEditingMeal(null); }} style={{ zIndex: 10000 }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Edit Meal</h3>
                <button onClick={() => { setShowEditMealModal(false); setEditingMeal(null); }}>×</button>
              </div>
              <div className="modal-body">
                <div className="food-search">
                  <input
                    type="text"
                    placeholder="Search food (USDA Database)"
                    value={foodSearch}
                    onChange={(e) => setFoodSearch(e.target.value)}
                  />
                  <button onClick={handleSearchFood} disabled={loading}>
                    {loading ? "Searching..." : "Search"}
                  </button>
                </div>
                {searchResults && (
                  <div className="search-result">
                    <p><strong>Found: {searchResults.name}</strong></p>
                    <p>Calories: {searchResults.calories} kcal</p>
                    {searchResults.protein > 0 && <p>Protein: {searchResults.protein}g</p>}
                    {searchResults.carbs > 0 && <p>Carbs: {searchResults.carbs}g</p>}
                    {searchResults.fats > 0 && <p>Fats: {searchResults.fats}g</p>}
                    <button onClick={() => {
                      setNewMeal({
                        ...newMeal,
                        name: searchResults.name,
                        calories: searchResults.calories,
                        macros: {
                          protein: searchResults.protein || 0,
                          carbs: searchResults.carbs || 0,
                          fats: searchResults.fats || 0
                        }
                      });
                    }} style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', background: '#FFD700', color: '#1e1e2f', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Use This</button>
                  </div>
                )}
                <div className="form-group">
                  <label>Meal Name</label>
                  <input
                    type="text"
                    value={newMeal.name}
                    onChange={(e) => setNewMeal({ ...newMeal, name: e.target.value })}
                    placeholder="e.g., Grilled Chicken Breast"
                  />
                </div>
                <div className="form-group">
                  <label>Time</label>
                  <input
                    type="time"
                    value={newMeal.time}
                    onChange={(e) => setNewMeal({ ...newMeal, time: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Meal Type</label>
                  <select
                    value={newMeal.timeOfDay}
                    onChange={(e) => setNewMeal({ ...newMeal, timeOfDay: e.target.value })}
                  >
                    <option>Breakfast</option>
                    <option>Lunch</option>
                    <option>Dinner</option>
                    <option>Snack</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Calories</label>
                  <input
                    type="number"
                    value={newMeal.calories}
                    onChange={(e) => setNewMeal({ ...newMeal, calories: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label>Notes (Optional)</label>
                  <textarea
                    value={newMeal.notes}
                    onChange={(e) => setNewMeal({ ...newMeal, notes: e.target.value })}
                    rows="2"
                    placeholder="Any additional notes..."
                  />
                </div>
                <div className="form-actions">
                  <button className="cancel-btn" onClick={() => { setShowEditMealModal(false); setEditingMeal(null); setSearchResults(null); setFoodSearch(""); }}>
                    Cancel
                  </button>
                  <button className="save-btn" onClick={handleUpdateMeal}>
                    Update Meal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Custom Meal Modal */}
        {showAddMealModal && (
          <div className="modal-overlay" onClick={() => setShowAddMealModal(false)} style={{ zIndex: 10000 }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Add Custom Meal</h3>
                <button onClick={() => setShowAddMealModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="food-search">
                  <input
                    type="text"
                    placeholder="Search food (USDA Database)"
                    value={foodSearch}
                    onChange={(e) => setFoodSearch(e.target.value)}
                  />
                  <button onClick={handleSearchFood} disabled={loading}>
                    {loading ? "Searching..." : "Search"}
                  </button>
                </div>
                {searchResults && (
                  <div className="search-result">
                    <p><strong>Found: {searchResults.name}</strong></p>
                    <p>Calories: {searchResults.calories} kcal</p>
                    {searchResults.protein > 0 && <p>Protein: {searchResults.protein}g</p>}
                    {searchResults.carbs > 0 && <p>Carbs: {searchResults.carbs}g</p>}
                    {searchResults.fats > 0 && <p>Fats: {searchResults.fats}g</p>}
                    {searchResults.servingSize && (
                      <p>
                        Serving: {searchResults.servingSize} {searchResults.servingSizeUnit || 'g'}
                      </p>
                    )}
                  </div>
                )}
                <div className="form-group">
                  <label>Meal Name</label>
                  <input
                    type="text"
                    value={newMeal.name}
                    onChange={(e) => setNewMeal({ ...newMeal, name: e.target.value })}
                    placeholder="e.g., Grilled Chicken Breast"
                  />
                </div>
                <div className="form-group">
                  <label>Time</label>
                  <input
                    type="time"
                    value={newMeal.time}
                    onChange={(e) => setNewMeal({ ...newMeal, time: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Meal Type</label>
                  <select
                    value={newMeal.timeOfDay}
                    onChange={(e) => setNewMeal({ ...newMeal, timeOfDay: e.target.value })}
                  >
                    <option>Breakfast</option>
                    <option>Lunch</option>
                    <option>Dinner</option>
                    <option>Snack</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Calories</label>
                  <input
                    type="number"
                    value={newMeal.calories}
                    onChange={(e) => setNewMeal({ ...newMeal, calories: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label>Notes (Optional)</label>
                  <textarea
                    value={newMeal.notes}
                    onChange={(e) => setNewMeal({ ...newMeal, notes: e.target.value })}
                    rows="2"
                    placeholder="Any additional notes..."
                  />
                </div>
                <div className="form-actions">
                  <button className="cancel-btn" onClick={() => { setShowAddMealModal(false); setSearchResults(null); setFoodSearch(""); }}>
                    Cancel
                  </button>
                  <button className="save-btn" onClick={handleAddCustomMeal}>
                    Add Meal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Meal Modal */}
        {showEditMealModal && editingMeal && (
          <div className="modal-overlay" onClick={() => { setShowEditMealModal(false); setEditingMeal(null); }} style={{ zIndex: 10000 }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxHeight: "90vh", overflowY: "auto" }}>
              <div className="modal-header">
                <h3>Edit Meal</h3>
                <button onClick={() => { setShowEditMealModal(false); setEditingMeal(null); }}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Meal Name</label>
                  <input
                    type="text"
                    value={editingMeal.name}
                    onChange={(e) => setEditingMeal({ ...editingMeal, name: e.target.value })}
                    placeholder="e.g., Grilled Chicken Breast"
                  />
                </div>
                <div className="form-group">
                  <label>Time</label>
                  <input
                    type="time"
                    value={editingMeal.time}
                    onChange={(e) => setEditingMeal({ ...editingMeal, time: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Meal Type</label>
                  <select
                    value={editingMeal.timeOfDay}
                    onChange={(e) => setEditingMeal({ ...editingMeal, timeOfDay: e.target.value })}
                  >
                    <option>Breakfast</option>
                    <option>Lunch</option>
                    <option>Dinner</option>
                    <option>Snack</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Calories</label>
                  <input
                    type="number"
                    value={editingMeal.calories || 0}
                    onChange={(e) => setEditingMeal({ ...editingMeal, calories: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label>Protein (g)</label>
                  <input
                    type="number"
                    value={editingMeal.macros?.protein || 0}
                    onChange={(e) => setEditingMeal({
                      ...editingMeal,
                      macros: { ...editingMeal.macros, protein: parseFloat(e.target.value) || 0 }
                    })}
                  />
                </div>
                <div className="form-group">
                  <label>Carbs (g)</label>
                  <input
                    type="number"
                    value={editingMeal.macros?.carbs || 0}
                    onChange={(e) => setEditingMeal({
                      ...editingMeal,
                      macros: { ...editingMeal.macros, carbs: parseFloat(e.target.value) || 0 }
                    })}
                  />
                </div>
                <div className="form-group">
                  <label>Fats (g)</label>
                  <input
                    type="number"
                    value={editingMeal.macros?.fats || 0}
                    onChange={(e) => setEditingMeal({
                      ...editingMeal,
                      macros: { ...editingMeal.macros, fats: parseFloat(e.target.value) || 0 }
                    })}
                  />
                </div>
                <div className="form-actions">
                  <button className="cancel-btn" onClick={() => { setShowEditMealModal(false); setEditingMeal(null); }}>
                    Cancel
                  </button>
                  <button className="save-btn" onClick={handleUpdateMeal}>
                    Update Meal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MealLogging;
