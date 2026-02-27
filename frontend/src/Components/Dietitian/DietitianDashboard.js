// frontend/src/Components/Dietitian/DietitianDashboard.js
import React, { useState, useEffect } from "react";
// import Layout from "../layout/Layout";
import { http } from "../../api/http";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../css/DietitianDashboard.css";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const DietitianDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [assignedMembers, setAssignedMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberSummary, setMemberSummary] = useState(null);
  const [mealLogs, setMealLogs] = useState([]);
  const [dietPlans, setDietPlans] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [dosDonts, setDosDonts] = useState(null);
  const [selectedMemberForDosDonts, setSelectedMemberForDosDonts] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedMealLog, setSelectedMealLog] = useState(null);
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [selectedRating, setSelectedRating] = useState("");
  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
  const [showEditPlanModal, setShowEditPlanModal] = useState(false);
  const [showAssignPlanModal, setShowAssignPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [assigningPlan, setAssigningPlan] = useState(null);
  const [newPlan, setNewPlan] = useState({
    category: "",
    meals: [
      { timeOfDay: "Breakfast", items: [""] },
      { timeOfDay: "Lunch", items: [""] },
      { timeOfDay: "Dinner", items: [""] },
      { timeOfDay: "Snack", items: [""] }
    ]
  });

  // Fetch assigned members on mount and when tab changes
  useEffect(() => {
    if (activeTab === "overview" || activeTab === "assigned-users" || activeTab === "reports") {
      fetchAssignedMembers();
    }
    if (activeTab === "meal-logs") {
      fetchMealLogs();
    }
    if (activeTab === "diet-plans") {
      fetchDietPlans();
    }
    if (activeTab === "announcements") {
      fetchAnnouncements();
    }
  }, [activeTab]);

  const fetchAssignedMembers = async () => {
    try {
      setLoading(true);
      const response = await http.get("/dietitian/assigned-members");
      if (response.data.success) {
        setAssignedMembers(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching assigned members:", error);
      toast.error("Failed to load assigned members");
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberSummary = async (memberId) => {
    try {
      setLoading(true);
      const response = await http.get(`/dietitian/member/${memberId}/summary`);
      if (response.data.success) {
        setMemberSummary(response.data.data);
        setSelectedMember(memberId);
        setActiveTab("assigned-users");
      }
    } catch (error) {
      console.error("Error fetching member summary:", error);
      toast.error("Failed to load member summary");
    } finally {
      setLoading(false);
    }
  };

  const fetchMealLogs = async (memberId = null) => {
    try {
      setLoading(true);
      const params = memberId ? { memberId } : {};
      const response = await http.get("/dietitian/meal-logs", { params });
      if (response.data.success) {
        setMealLogs(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching meal logs:", error);
      toast.error("Failed to load meal logs");
    } finally {
      setLoading(false);
    }
  };

  const fetchDietPlans = async () => {
    try {
      setLoading(true);
      const response = await http.get("/dietitian/diet-plans");
      if (response.data.success) {
        setDietPlans(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching diet plans:", error);
      toast.error("Failed to load diet plans");
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await http.get("/announcements/all-announcements", {
        params: { role: "RD" } // Filter for Dietitian role
      });
      // Handle both new format (with success) and old format (direct array)
      if (response.data.success) {
        setAnnouncements(response.data.data || []);
      } else if (Array.isArray(response.data)) {
        // Filter announcements for RD role or all active announcements
        const filtered = response.data.filter(
          (ann) => ann.active && (ann.recipients?.includes("RD") || ann.recipients?.includes("RDN"))
        );
        setAnnouncements(filtered);
      } else {
        setAnnouncements([]);
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
      toast.error("Failed to load announcements");
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDosDonts = async (memberId) => {
    try {
      const response = await http.get(`/dos-donts/${memberId}`);
      if (response.data.success) {
        setDosDonts(response.data.data);
        setSelectedMemberForDosDonts(memberId);
      }
    } catch (error) {
      console.error("Error fetching Do's & Don'ts:", error);
      setDosDonts({ dos: [], donts: [], notes: "" });
    }
  };

  const handleUpdateDosDonts = async (memberId, dos, donts, notes) => {
    try {
      const response = await http.put(`/dos-donts/${memberId}`, { dos, donts, notes });
      if (response.data.success) {
        toast.success("Do's & Don'ts updated!");
        fetchDosDonts(memberId);
      }
    } catch (error) {
      console.error("Error updating Do's & Don'ts:", error);
      toast.error("Failed to update Do's & Don'ts");
    }
  };

  const handleGenerateReport = async (memberId) => {
    try {
      setLoading(true);
      const response = await http.get(`/dietitian/report/${memberId}`);
      if (response.data.success) {
        setReportData(response.data.data);
        setSelectedMemberForDosDonts(memberId);
      }
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const handleAddFeedback = async () => {
    if (!selectedRating || !selectedMealLog) {
      toast.error("Please select a rating");
      return;
    }
    try {
      const response = await http.post(`/dietitian/meal-logs/${selectedMealLog}/feedback`, {
        rating: selectedRating,
        notes: feedbackNotes
      });
      if (response.data.success) {
        toast.success("Feedback added!");
        setShowFeedbackModal(false);
        setSelectedMealLog(null);
        setFeedbackNotes("");
        setSelectedRating("");
        fetchMealLogs(selectedMember);
      }
    } catch (error) {
      console.error("Error adding feedback:", error);
      toast.error("Failed to add feedback");
    }
  };

  const openFeedbackModal = (mealLogId) => {
    setSelectedMealLog(mealLogId);
    setShowFeedbackModal(true);
  };

  const handleCreatePlan = async () => {
    if (!newPlan.category.trim()) {
      toast.error("Please enter a category");
      return;
    }

    // Validate meals
    const validMeals = newPlan.meals
      .map(meal => ({
        timeOfDay: meal.timeOfDay,
        items: meal.items.filter(item => item.trim() !== "")
      }))
      .filter(meal => meal.items.length > 0);

    if (validMeals.length === 0) {
      toast.error("Please add at least one meal item");
      return;
    }

    try {
      const response = await http.post("/dietitian/diet-plans", {
        category: newPlan.category,
        meals: validMeals
      });
      if (response.data.success) {
        toast.success("Diet plan created successfully!");
        setShowCreatePlanModal(false);
        setNewPlan({
          category: "",
          meals: [
            { timeOfDay: "Breakfast", items: [""] },
            { timeOfDay: "Lunch", items: [""] },
            { timeOfDay: "Dinner", items: [""] },
            { timeOfDay: "Snack", items: [""] }
          ]
        });
        fetchDietPlans();
      } else {
        toast.error(response.data.message || "Failed to create diet plan");
      }
    } catch (error) {
      console.error("Error creating diet plan:", error);
      toast.error(error.response?.data?.message || "Failed to create diet plan");
    }
  };

  const handleEditPlan = async () => {
    if (!editingPlan || !editingPlan.category.trim()) {
      toast.error("Please enter a category");
      return;
    }

    const validMeals = editingPlan.meals
      .map(meal => ({
        timeOfDay: meal.timeOfDay,
        items: meal.items.filter(item => item.trim() !== "")
      }))
      .filter(meal => meal.items.length > 0);

    if (validMeals.length === 0) {
      toast.error("Please add at least one meal item");
      return;
    }

    try {
      const response = await http.put(`/dietitian/diet-plans/${editingPlan._id}`, {
        category: editingPlan.category,
        meals: validMeals
      });
      if (response.data.success) {
        toast.success("Diet plan updated successfully!");
        setShowEditPlanModal(false);
        setEditingPlan(null);
        fetchDietPlans();
      } else {
        toast.error(response.data.message || "Failed to update diet plan");
      }
    } catch (error) {
      console.error("Error updating diet plan:", error);
      toast.error(error.response?.data?.message || "Failed to update diet plan");
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm("Are you sure you want to delete this diet plan?")) {
      return;
    }

    try {
      const response = await http.delete(`/dietitian/diet-plans/${planId}`);
      if (response.data.success) {
        toast.success("Diet plan deleted successfully!");
        fetchDietPlans();
      } else {
        toast.error(response.data.message || "Failed to delete diet plan");
      }
    } catch (error) {
      console.error("Error deleting diet plan:", error);
      toast.error(error.response?.data?.message || "Failed to delete diet plan");
    }
  };

  const handleAssignPlan = async (memberId) => {
    if (!memberId || !assigningPlan) {
      toast.error("Please select a member");
      return;
    }

    try {
      const response = await http.post("/dietitian/assign-diet-plan", {
        memberId,
        dietPlanId: assigningPlan._id
      });
      if (response.data.success) {
        toast.success("Diet plan assigned successfully!");
        setShowAssignPlanModal(false);
        setAssigningPlan(null);
        // Refresh assigned members to show updated plan
        fetchAssignedMembers();
      } else {
        toast.error(response.data.message || "Failed to assign diet plan");
      }
    } catch (error) {
      console.error("Error assigning diet plan:", error);
      toast.error(error.response?.data?.message || "Failed to assign diet plan");
    }
  };

  const openEditModal = (plan) => {
    setEditingPlan({
      ...plan,
      meals: plan.meals && plan.meals.length > 0 ? plan.meals : [
        { timeOfDay: "Breakfast", items: [""] },
        { timeOfDay: "Lunch", items: [""] },
        { timeOfDay: "Dinner", items: [""] },
        { timeOfDay: "Snack", items: [""] }
      ]
    });
    setShowEditPlanModal(true);
  };

  const openAssignModal = (plan) => {
    setAssigningPlan(plan);
    setShowAssignPlanModal(true);
  };

  return (
    <div>
      <div className="dietitian-dashboard">
        <div className="dashboard-header">
          <h1>Dietitian Dashboard</h1>
          <p>Manage your assigned members and nutrition plans</p>
        </div>

        <div className="dashboard-tabs">
          <button
            className={activeTab === "overview" ? "active" : ""}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            className={activeTab === "assigned-users" ? "active" : ""}
            onClick={() => setActiveTab("assigned-users")}
          >
            Assigned Users
          </button>
          <button
            className={activeTab === "diet-plans" ? "active" : ""}
            onClick={() => setActiveTab("diet-plans")}
          >
            Diet Plans
          </button>
          <button
            className={activeTab === "meal-logs" ? "active" : ""}
            onClick={() => {
              setActiveTab("meal-logs");
              fetchMealLogs();
            }}
          >
            Meal Logs Review
          </button>
          <button
            className={activeTab === "reports" ? "active" : ""}
            onClick={() => setActiveTab("reports")}
          >
            Reports & Do's/Don'ts
          </button>
          <button
            className={activeTab === "announcements" ? "active" : ""}
            onClick={() => {
              setActiveTab("announcements");
              fetchAnnouncements();
            }}
          >
            Announcements
          </button>
        </div>

        <div className="dashboard-content">
          {activeTab === "overview" && (
            <div className="overview-tab">
              <div className="stats-grid">
                <div
                  className="stat-card clickable"
                  onClick={() => {
                    fetchAssignedMembers();
                    setActiveTab("assigned-users");
                  }}
                >
                  <h3>{assignedMembers.length}</h3>
                  <p>Assigned Members</p>
                </div>
                <div
                  className="stat-card clickable"
                  onClick={() => {
                    fetchAssignedMembers();
                    setActiveTab("assigned-users");
                  }}
                >
                  <h3>{assignedMembers.filter(m => m.status === "ok").length}</h3>
                  <p>On Track</p>
                </div>
                <div
                  className="stat-card clickable"
                  onClick={() => {
                    fetchAssignedMembers();
                    setActiveTab("assigned-users");
                  }}
                >
                  <h3>{assignedMembers.filter(m => m.status === "needs_attention").length}</h3>
                  <p>Needs Attention</p>
                </div>
              </div>
              <p style={{ color: "#ccc", marginTop: "20px" }}>
                Click on any card above to view details, or select a tab to manage your members and nutrition plans.
              </p>
            </div>
          )}

          {activeTab === "assigned-users" && (
            <div className="assigned-users-tab">
              {loading ? (
                <div className="loading">Loading...</div>
              ) : assignedMembers.length === 0 ? (
                <div className="empty-state">
                  <p>No assigned members yet.</p>
                </div>
              ) : (
                <>
                  <div className="members-list">
                    {assignedMembers.map((member) => (
                      <div
                        key={member._id}
                        className={`member-card ${selectedMember === member._id ? "selected" : ""}`}
                        onClick={() => fetchMemberSummary(member._id)}
                      >
                        <div className="member-info">
                          <h4>{member.name}</h4>
                          <p>{member.email}</p>
                          <div className="member-stats">
                            <span>Adherence: {member.adherence || 0}%</span>
                            <span className={`status ${member.status}`}>
                              {member.status === "ok" ? "✅ OK" : member.status === "warning" ? "⚠️ Warning" : "❌ Needs Attention"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {memberSummary && (
                    <div className="member-detail">
                      <h3>{memberSummary.member.name} - Summary</h3>
                      <div className="summary-sections">
                        <div className="section">
                          <h4>Current Diet Plan</h4>
                          {memberSummary.dietPlan ? (
                            <p>{memberSummary.dietPlan.category}</p>
                          ) : (
                            <p>No diet plan assigned</p>
                          )}
                        </div>
                        <div className="section">
                          <h4>Weight Trend</h4>
                          {memberSummary.progress && memberSummary.progress.length > 0 ? (
                            <div>
                              <p>Latest: {memberSummary.progress[memberSummary.progress.length - 1].weight} kg</p>
                              <p>First: {memberSummary.progress[0].weight} kg</p>
                            </div>
                          ) : (
                            <p>No progress data</p>
                          )}
                        </div>
                        <div className="section">
                          <h4>Recent Meal Logs</h4>
                          {memberSummary.mealLogs && memberSummary.mealLogs.length > 0 ? (
                            memberSummary.mealLogs.slice(0, 5).map((log) => (
                              <div key={log._id} className="meal-log-item">
                                <p>{new Date(log.date).toLocaleDateString()}</p>
                                <p>{log.meals?.length || 0} meals logged</p>
                                <p>Total: {log.totalCalories || 0} cal</p>
                              </div>
                            ))
                          ) : (
                            <p>No meal logs yet</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === "diet-plans" && (
            <div className="diet-plans-tab">
              <div className="diet-plans-header">
                <h2>Diet Plan Management</h2>
                <button className="btn-primary" onClick={() => setShowCreatePlanModal(true)}>
                  + Create New Plan
                </button>
              </div>
              {loading ? (
                <div className="loading">Loading diet plans...</div>
              ) : dietPlans.length === 0 ? (
                <div className="empty-state">
                  <p>No diet plans available. Create one to get started.</p>
                </div>
              ) : (
                <div className="diet-plans-list">
                  {dietPlans.map((plan) => (
                    <div key={plan._id} className="diet-plan-card">
                      <div className="plan-header">
                        <h3>{plan.category}</h3>
                        <span className="plan-date">
                          {new Date(plan.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="plan-meals">
                        {plan.meals && plan.meals.map((mealGroup, idx) => (
                          <div key={idx} className="meal-group">
                            <h4>{mealGroup.timeOfDay}</h4>
                            <ul>
                              {mealGroup.items && mealGroup.items.map((item, itemIdx) => (
                                <li key={itemIdx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                      <div className="plan-actions">
                        <button className="btn-secondary" onClick={() => openEditModal(plan)}>
                          Edit
                        </button>
                        <button className="btn-secondary" onClick={() => openAssignModal(plan)}>
                          Assign to Member
                        </button>
                        <button className="btn-danger" onClick={() => handleDeletePlan(plan._id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "meal-logs" && (
            <div className="meal-logs-tab">
              <div className="meal-logs-header">
                <h2>Meal Logs Review</h2>
                <select
                  onChange={(e) => {
                    const memberId = e.target.value;
                    if (memberId) {
                      fetchMealLogs(memberId);
                      setSelectedMember(memberId);
                    } else {
                      fetchMealLogs();
                      setSelectedMember(null);
                    }
                  }}
                  style={{ padding: "8px", borderRadius: "4px" }}
                >
                  <option value="">All Assigned Members</option>
                  {assignedMembers.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
              {loading ? (
                <div className="loading">Loading meal logs...</div>
              ) : mealLogs.length === 0 ? (
                <div className="empty-state">
                  <p>No meal logs found for assigned members.</p>
                </div>
              ) : (
                <div className="meal-logs-list">
                  {mealLogs.map((log) => (
                    <div key={log._id} className="meal-log-card">
                      <div className="log-header">
                        <h4>{log.user?.name || "Unknown"}</h4>
                        <span>{new Date(log.date).toLocaleDateString()}</span>
                      </div>
                      <div className="log-meals">
                        {log.meals && log.meals.map((meal, idx) => (
                          <div key={idx} className="meal-item">
                            <span>{meal.timeOfDay}: {meal.name}</span>
                            <span>{meal.calories || 0} cal</span>
                            {meal.isFromPlan && <span className="badge">From Plan</span>}
                          </div>
                        ))}
                      </div>
                      <div className="log-totals">
                        <p>Total: {log.totalCalories || 0} calories</p>
                        {log.totalMacros && (
                          <p>
                            P: {log.totalMacros.protein || 0}g | 
                            C: {log.totalMacros.carbs || 0}g | 
                            F: {log.totalMacros.fats || 0}g
                          </p>
                        )}
                      </div>
                      {!log.feedback?.rating && (
                        <div className="feedback-section">
                          <button onClick={() => openFeedbackModal(log._id)}>
                            Add Feedback
                          </button>
                        </div>
                      )}
                      {log.feedback && (
                        <div className="feedback-display">
                          <p><strong>Feedback:</strong> {log.feedback.rating}</p>
                          {log.feedback.notes && <p>{log.feedback.notes}</p>}
                          <p style={{ fontSize: "0.85rem", color: "#888" }}>
                            Given on: {new Date(log.feedback.givenAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "reports" && (
            <div className="reports-tab">
              <div className="reports-header">
                <h2>Reports & Do's/Don'ts</h2>
              </div>
              <div className="reports-content">
                <div className="reports-section">
                  <h3>Generate Member Report</h3>
                  <select
                    onChange={(e) => {
                      const memberId = e.target.value;
                      if (memberId) {
                        handleGenerateReport(memberId);
                      }
                    }}
                    style={{ padding: "8px", borderRadius: "4px", width: "300px" }}
                  >
                    <option value="">Select Member</option>
                    {assignedMembers.map((member) => (
                      <option key={member._id} value={member._id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                  {reportData && (
                    <div className="report-display">
                      <h4>Report for {reportData.member.name}</h4>
                      <div className="report-stats">
                        <p><strong>Average Calories:</strong> {reportData.statistics.avgCalories} kcal</p>
                        <p><strong>Average Adherence:</strong> {reportData.statistics.avgAdherence}%</p>
                        <p><strong>Weight Change:</strong> {reportData.statistics.weightChange ? `${reportData.statistics.weightChange > 0 ? '+' : ''}${reportData.statistics.weightChange} kg` : 'N/A'}</p>
                        <p><strong>Total Meals:</strong> {reportData.statistics.totalMeals}</p>
                        <p><strong>Plan Meals:</strong> {reportData.statistics.planMeals}</p>
                      </div>
                      {reportData.topFoods && reportData.topFoods.length > 0 && (
                        <div className="top-foods">
                          <h5>Most Frequent Foods</h5>
                          <ul>
                            {reportData.topFoods.map((food, idx) => (
                              <li key={idx}>{food.name} ({food.count} times)</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="dos-donts-section">
                  <h3>Do's & Don'ts Management</h3>
                  <select
                    onChange={(e) => {
                      const memberId = e.target.value;
                      if (memberId) {
                        fetchDosDonts(memberId);
                      }
                    }}
                    style={{ padding: "8px", borderRadius: "4px", width: "300px", marginBottom: "20px" }}
                  >
                    <option value="">Select Member</option>
                    {assignedMembers.map((member) => (
                      <option key={member._id} value={member._id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                  {selectedMemberForDosDonts && dosDonts && (
                    <DosDontsEditor
                      memberId={selectedMemberForDosDonts}
                      dosDonts={dosDonts}
                      onUpdate={handleUpdateDosDonts}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "announcements" && (
            <div className="announcements-tab">
              <h2>Announcements for Dietitians</h2>
              {loading ? (
                <div className="loading">Loading announcements...</div>
              ) : announcements.length === 0 ? (
                <div className="empty-state">
                  <p>No announcements available.</p>
                </div>
              ) : (
                <div className="announcements-list">
                  {announcements.map((announcement) => (
                    <div key={announcement._id} className="announcement-card">
                      <div className="announcement-header">
                        <h3>{announcement.title}</h3>
                        <span>{new Date(announcement.date).toLocaleDateString()}</span>
                      </div>
                      <p>{announcement.description}</p>
                      <div className="announcement-meta">
                        <span>Type: {announcement.type}</span>
                        <span className={announcement.active ? "active-badge" : "inactive-badge"}>
                          {announcement.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Diet Plan Modal */}
      {showCreatePlanModal && (
        <DietPlanModal
          title="Create New Diet Plan"
          plan={newPlan}
          setPlan={setNewPlan}
          onSave={handleCreatePlan}
          onClose={() => setShowCreatePlanModal(false)}
        />
      )}

      {/* Edit Diet Plan Modal */}
      {showEditPlanModal && editingPlan && (
        <DietPlanModal
          title="Edit Diet Plan"
          plan={editingPlan}
          setPlan={setEditingPlan}
          onSave={handleEditPlan}
          onClose={() => {
            setShowEditPlanModal(false);
            setEditingPlan(null);
          }}
        />
      )}

      {/* Assign Diet Plan Modal */}
      {showAssignPlanModal && assigningPlan && (
        <div className="modal-overlay" onClick={() => setShowAssignPlanModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assign Diet Plan: {assigningPlan.category}</h3>
              <button onClick={() => setShowAssignPlanModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Select Member</label>
                <select
                  id="assignMemberSelect"
                  style={{ width: "100%", padding: "8px" }}
                  defaultValue=""
                >
                  <option value="">Select a member</option>
                  {assignedMembers.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name} ({member.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowAssignPlanModal(false)}>
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={() => {
                    const select = document.getElementById("assignMemberSelect");
                    if (select.value) {
                      handleAssignPlan(select.value);
                    } else {
                      toast.error("Please select a member");
                    }
                  }}
                >
                  Assign Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="modal-overlay" onClick={() => setShowFeedbackModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Feedback</h3>
              <button onClick={() => setShowFeedbackModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Rating</label>
                <select
                  value={selectedRating}
                  onChange={(e) => setSelectedRating(e.target.value)}
                  style={{ width: "100%", padding: "8px" }}
                >
                  <option value="">Select rating</option>
                  <option value="good">Good</option>
                  <option value="average">Average</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  rows="4"
                  style={{ width: "100%", padding: "8px" }}
                  placeholder="Add any additional notes..."
                />
              </div>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowFeedbackModal(false)}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleAddFeedback}>
                  Save Feedback
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Diet Plan Modal Component
const DietPlanModal = ({ title, plan, setPlan, onSave, onClose }) => {
  const addMealItem = (mealIndex) => {
    const updatedMeals = [...plan.meals];
    updatedMeals[mealIndex].items.push("");
    setPlan({ ...plan, meals: updatedMeals });
  };

  const removeMealItem = (mealIndex, itemIndex) => {
    const updatedMeals = [...plan.meals];
    updatedMeals[mealIndex].items = updatedMeals[mealIndex].items.filter((_, i) => i !== itemIndex);
    setPlan({ ...plan, meals: updatedMeals });
  };

  const updateMealItem = (mealIndex, itemIndex, value) => {
    const updatedMeals = [...plan.meals];
    updatedMeals[mealIndex].items[itemIndex] = value;
    setPlan({ ...plan, meals: updatedMeals });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Category *</label>
            <input
              type="text"
              value={plan.category}
              onChange={(e) => setPlan({ ...plan, category: e.target.value })}
              placeholder="e.g., Weight Loss, Muscle Gain, General Health"
              style={{ width: "100%", padding: "8px" }}
            />
          </div>

          <div className="meals-editor">
            <h4>Meals</h4>
            {plan.meals.map((meal, mealIndex) => (
              <div key={mealIndex} className="meal-editor-group">
                <h5>{meal.timeOfDay}</h5>
                {meal.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="meal-item-input">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateMealItem(mealIndex, itemIndex, e.target.value)}
                      placeholder={`${meal.timeOfDay} item ${itemIndex + 1}`}
                      style={{ flex: 1, padding: "8px", marginRight: "8px" }}
                    />
                    {meal.items.length > 1 && (
                      <button
                        className="btn-danger"
                        onClick={() => removeMealItem(mealIndex, itemIndex)}
                        style={{ padding: "8px 12px" }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  className="btn-secondary"
                  onClick={() => addMealItem(mealIndex)}
                  style={{ marginTop: "8px" }}
                >
                  + Add {meal.timeOfDay} Item
                </button>
              </div>
            ))}
          </div>

          <div className="modal-actions">
            <button className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-primary" onClick={onSave}>
              Save Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Do's & Don'ts Editor Component
const DosDontsEditor = ({ memberId, dosDonts, onUpdate }) => {
  const [dos, setDos] = useState(dosDonts.dos || []);
  const [donts, setDonts] = useState(dosDonts.donts || []);
  const [notes, setNotes] = useState(dosDonts.notes || "");
  const [newDo, setNewDo] = useState("");
  const [newDont, setNewDont] = useState("");

  const handleAddDo = () => {
    if (newDo.trim()) {
      setDos([...dos, newDo.trim()]);
      setNewDo("");
    }
  };

  const handleAddDont = () => {
    if (newDont.trim()) {
      setDonts([...donts, newDont.trim()]);
      setNewDont("");
    }
  };

  const handleRemoveDo = (index) => {
    setDos(dos.filter((_, i) => i !== index));
  };

  const handleRemoveDont = (index) => {
    setDonts(donts.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onUpdate(memberId, dos, donts, notes);
  };

  return (
    <div className="dos-donts-editor">
      <div className="dos-section">
        <h4>Do's</h4>
        <div className="input-group">
          <input
            type="text"
            value={newDo}
            onChange={(e) => setNewDo(e.target.value)}
            placeholder="Add a 'Do' item"
            onKeyPress={(e) => e.key === "Enter" && handleAddDo()}
          />
          <button onClick={handleAddDo}>Add</button>
        </div>
        <ul>
          {dos.map((item, index) => (
            <li key={index}>
              <span>✓ {item}</span>
              <button onClick={() => handleRemoveDo(index)}>Remove</button>
            </li>
          ))}
        </ul>
      </div>

      <div className="donts-section">
        <h4>Don'ts</h4>
        <div className="input-group">
          <input
            type="text"
            value={newDont}
            onChange={(e) => setNewDont(e.target.value)}
            placeholder="Add a 'Don't' item"
            onKeyPress={(e) => e.key === "Enter" && handleAddDont()}
          />
          <button onClick={handleAddDont}>Add</button>
        </div>
        <ul>
          {donts.map((item, index) => (
            <li key={index}>
              <span>✗ {item}</span>
              <button onClick={() => handleRemoveDont(index)}>Remove</button>
            </li>
          ))}
        </ul>
      </div>

      <div className="notes-section">
        <h4>Notes</h4>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows="4"
          placeholder="Additional notes..."
        />
      </div>

      <button className="btn-primary" onClick={handleSave}>
        Save Do's & Don'ts
      </button>
    </div>
  );
};

export default DietitianDashboard;
