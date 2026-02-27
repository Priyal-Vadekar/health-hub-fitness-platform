import React, { useState, useEffect } from "react";
// import Layout from "../layout/Layout";
import { http } from "../../api/http";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../css/DietitianDashboard.css";
import { useNavigate } from "react-router-dom";

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

  useEffect(() => {
    fetchDashboardData();
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      if (activeTab === "overview") {
        await Promise.all([
          fetchMembership(),
          fetchDietPlan(),
          fetchStats()
        ]);
      } else if (activeTab === "membership") {
        await fetchMembership();
        await fetchMembershipHistory();
      } else if (activeTab === "diet-plan") {
        await fetchDietPlan();
      } else if (activeTab === "announcements") {
        await fetchAnnouncements();
      } else if (activeTab === "trainer-sessions") {
        await fetchTrainerSessions();
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembership = async () => {
    try {
      const response = await http.get("/user-membership-plans/my-membership");
      if (response.data.success && response.data.data) {
        setCurrentMembership(response.data.data);
        setStats(prev => ({
          ...prev,
          membershipStatus: response.data.data.isActive ? "Active" : "Inactive"
        }));
      }
    } catch (error) {
      console.error("Error fetching membership:", error);
    }
  };

  const fetchMembershipHistory = async () => {
    try {
      const response = await http.get("/user-membership-plans/history");
      if (response.data.success) {
        setMembershipHistory(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching membership history:", error);
    }
  };

  const fetchDietPlan = async () => {
    try {
      const response = await http.get("/assigned-dietplans/member");
      if (response.data && response.data.length > 0) {
        const latestPlan = response.data[0];
        const planResponse = await http.get(`/diet-plans/${latestPlan.dietPlan}`);
        if (planResponse.data.success) {
          setMyDietPlan(planResponse.data.data);
          setStats(prev => ({ ...prev, dietPlanAssigned: true }));
        }
      } else {
        setMyDietPlan(null);
        setStats(prev => ({ ...prev, dietPlanAssigned: false }));
      }
    } catch (error) {
      console.error("Error fetching diet plan:", error);
      setMyDietPlan(null);
    }
  };

  const fetchStats = async () => {
    try {
      const [progressRes, mealLogsRes, sessionsRes] = await Promise.allSettled([
        http.get("/progress/summary", { params: { days: 30 } }),
        http.get("/meal-logs/date/" + new Date().toISOString().split('T')[0]),
        http.get("/bookings/my")
      ]);

      if (progressRes.status === 'fulfilled' && progressRes.value.data.success) {
        setStats(prev => ({
          ...prev,
          progressEntries: progressRes.value.data.data.weight?.length || 0
        }));
      }

      if (mealLogsRes.status === 'fulfilled' && mealLogsRes.value.data.success) {
        const meals = mealLogsRes.value.data.data?.meals || [];
        setStats(prev => ({ ...prev, mealLogsToday: meals.length }));
      }

      if (sessionsRes.status === 'fulfilled' && sessionsRes.value.data.success) {
        const upcoming = (sessionsRes.value.data.data || []).filter(
          s => new Date(s.date) >= new Date() && s.status === "confirmed"
        );
        setStats(prev => ({ ...prev, upcomingSessions: upcoming.length }));
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const response = await http.get("/announcements/all-announcements", {
        params: { role: "Member" }
      });
      
      let announcementsList = [];
      if (response.data.success) {
        announcementsList = response.data.data || [];
      } else if (Array.isArray(response.data)) {
        announcementsList = response.data;
      }

      // Filter: Only show announcements created 24+ hours ago
      const now = new Date();
      const filtered = announcementsList.filter(ann => {
        if (!ann.active) return false;
        const createdAt = new Date(ann.createdAt || ann.date);
        const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
        return hoursDiff >= 24;
      });

      setAnnouncements(filtered);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      setAnnouncements([]);
    }
  };

  const fetchTrainerSessions = async () => {
    try {
      const response = await http.get("/bookings/my");
      if (response.data.success) {
        setTrainerSessions(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching trainer sessions:", error);
      setTrainerSessions([]);
    }
  };

  const handleCancelMembership = async () => {
    if (!window.confirm("Are you sure you want to cancel auto-renewal? Your membership will remain active until the end date.")) {
      return;
    }

    try {
      const response = await http.patch(`/user-membership-plans/${currentMembership._id}/cancel`);
      if (response.data.success) {
        toast.success("Auto-renewal cancelled. Your membership will remain active until the end date.");
        fetchMembership();
      }
    } catch (error) {
      console.error("Error cancelling membership:", error);
      toast.error("Failed to cancel membership");
    }
  };

  return (
    <div>
      <div className="dietitian-dashboard">
        <div className="dashboard-header">
          <h1>Member Dashboard</h1>
          <p>Welcome! Manage your fitness journey from here.</p>
        </div>

        <div className="dashboard-tabs">
          <button
            className={activeTab === "overview" ? "active" : ""}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            className={activeTab === "membership" ? "active" : ""}
            onClick={() => setActiveTab("membership")}
          >
            My Membership
          </button>
          <button
            className={activeTab === "diet-plan" ? "active" : ""}
            onClick={() => setActiveTab("diet-plan")}
          >
            My Diet Plan
          </button>
          <button
            className={activeTab === "progress" ? "active" : ""}
            onClick={() => {
              setActiveTab("progress");
              navigate("/progress");
            }}
          >
            Progress Tracking
          </button>
          <button
            className={activeTab === "meal-logging" ? "active" : ""}
            onClick={() => {
              setActiveTab("meal-logging");
              navigate("/meal-logging");
            }}
          >
            Meal Logging
          </button>
          <button
            className={activeTab === "trainer-sessions" ? "active" : ""}
            onClick={() => setActiveTab("trainer-sessions")}
          >
            Trainer Sessions
          </button>
          <button
            className={activeTab === "announcements" ? "active" : ""}
            onClick={() => setActiveTab("announcements")}
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
                  onClick={() => setActiveTab("membership")}
                >
                  <h3>{stats.membershipStatus}</h3>
                  <p>Membership Status</p>
                </div>
                <div
                  className="stat-card clickable"
                  onClick={() => setActiveTab("diet-plan")}
                >
                  <h3>{stats.dietPlanAssigned ? "Yes" : "No"}</h3>
                  <p>Diet Plan Assigned</p>
                </div>
                <div
                  className="stat-card clickable"
                  onClick={() => navigate("/progress")}
                >
                  <h3>{stats.progressEntries}</h3>
                  <p>Progress Entries</p>
                </div>
                <div
                  className="stat-card clickable"
                  onClick={() => navigate("/meal-logging")}
                >
                  <h3>{stats.mealLogsToday}</h3>
                  <p>Meals Logged Today</p>
                </div>
                <div
                  className="stat-card clickable"
                  onClick={() => setActiveTab("trainer-sessions")}
                >
                  <h3>{stats.upcomingSessions}</h3>
                  <p>Upcoming Sessions</p>
                </div>
              </div>
              <p style={{ color: "#ccc", marginTop: "20px" }}>
                Click on any card above to view details, or select a tab to manage your fitness journey.
              </p>
            </div>
          )}

          {activeTab === "membership" && (
            <div className="membership-tab">
              <div className="diet-plans-header">
                <h2>My Membership</h2>
                {!currentMembership || !currentMembership.isActive ? (
                  <button className="btn-primary" onClick={() => navigate("/membership-plan")}>
                    Buy Membership
                  </button>
                ) : (
                  <button className="btn-primary" onClick={() => navigate("/membership-plan")}>
                    Renew / Upgrade
                  </button>
                )}
              </div>

              {loading ? (
                <div className="loading">Loading membership...</div>
              ) : currentMembership ? (
                <div className="diet-plan-card">
                  <div className="plan-header">
                    <h3>{currentMembership.membershipPlan?.title || "Membership Plan"}</h3>
                    <span className={`badge ${currentMembership.isActive ? "active-badge" : "inactive-badge"}`}>
                      {currentMembership.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="plan-meals">
                    <p><strong>Start Date:</strong> {new Date(currentMembership.startDate).toLocaleDateString()}</p>
                    <p><strong>End Date:</strong> {new Date(currentMembership.endDate).toLocaleDateString()}</p>
                    <p><strong>Price:</strong> ₹{currentMembership.totalPrice}</p>
                    <p><strong>Personal Trainer:</strong> {currentMembership.withPersonalTrainer ? "Yes" : "No"}</p>
                    {currentMembership.membershipPlan?.benefits && (
                      <div>
                        <strong>Benefits:</strong>
                        <ul>
                          {currentMembership.membershipPlan.benefits.map((benefit, idx) => (
                            <li key={idx}>{benefit}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  {currentMembership.isActive && (
                    <div className="plan-actions">
                      <button className="btn-danger" onClick={handleCancelMembership}>
                        Cancel Auto-Renewal
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No active membership found. Purchase a membership to get started!</p>
                  <button className="btn-primary" onClick={() => navigate("/membership-plan")}>
                    Buy Membership
                  </button>
                </div>
              )}

              <div style={{ marginTop: "3rem" }}>
                <h2>Membership History</h2>
                {membershipHistory.length === 0 ? (
                  <div className="empty-state">
                    <p>No membership history available.</p>
                  </div>
                ) : (
                  <div className="diet-plans-list">
                    {membershipHistory.map((membership) => (
                      <div key={membership._id} className="diet-plan-card">
                        <div className="plan-header">
                          <h3>{membership.membershipPlan?.title || "Plan"}</h3>
                          <span className={`badge ${membership.isActive ? "active-badge" : "inactive-badge"}`}>
                            {membership.isActive ? "Active" : "Expired"}
                          </span>
                        </div>
                        <div className="plan-meals">
                          <p><strong>Start:</strong> {new Date(membership.startDate).toLocaleDateString()}</p>
                          <p><strong>End:</strong> {new Date(membership.endDate).toLocaleDateString()}</p>
                          <p><strong>Price:</strong> ₹{membership.totalPrice}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "diet-plan" && (
            <div className="diet-plans-tab">
              <h2>My Diet Plan</h2>
              {loading ? (
                <div className="loading">Loading diet plan...</div>
              ) : myDietPlan ? (
                <div className="diet-plan-card">
                  <div className="plan-header">
                    <h3>{myDietPlan.category}</h3>
                    <span className="plan-date">
                      Assigned: {new Date(myDietPlan.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="plan-meals">
                    {myDietPlan.meals && myDietPlan.meals.map((mealGroup, idx) => (
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
                </div>
              ) : (
                <div className="empty-state">
                  <p>No diet plan assigned yet. Request a diet plan from your profile page.</p>
                  <button className="btn-primary" onClick={() => navigate("/profile")}>
                    Request Diet Plan
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "trainer-sessions" && (
            <div className="meal-logs-tab">
              <div className="meal-logs-header">
                <h2>My Trainer Sessions</h2>
                <button className="btn-primary" onClick={() => navigate("/trainer")}>
                  Book New Session
                </button>
              </div>
              {loading ? (
                <div className="loading">Loading sessions...</div>
              ) : trainerSessions.length === 0 ? (
                <div className="empty-state">
                  <p>No trainer sessions booked yet.</p>
                </div>
              ) : (
                <div className="meal-logs-list">
                  {trainerSessions.map((session) => (
                    <div key={session._id} className="meal-log-card">
                      <div className="log-header">
                        <h4>{session.trainer?.name || "Trainer"}</h4>
                        <span className={`badge ${session.status === "confirmed" ? "active-badge" : "inactive-badge"}`}>
                          {session.status}
                        </span>
                      </div>
                      <div className="log-meals">
                        <p><strong>Date:</strong> {new Date(session.date).toLocaleDateString()}</p>
                        <p><strong>Time:</strong> {session.timeSlot}</p>
                        <p><strong>Duration:</strong> {session.duration} minutes</p>
                        {session.sessionType && <p><strong>Type:</strong> {session.sessionType}</p>}
                        {session.price && <p><strong>Price:</strong> ₹{session.price}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "announcements" && (
            <div className="announcements-tab">
              <h2>Announcements</h2>
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
                        <span className="active-badge">New</span>
                      </div>
                      <p>{announcement.description}</p>
                      <div className="announcement-meta">
                        <span>{new Date(announcement.date || announcement.createdAt).toLocaleDateString()}</span>
                        <span>{announcement.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberDashboard;
