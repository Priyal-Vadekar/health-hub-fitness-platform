// frontend/src/Components/membership/MembershipManagement.js
import React, { useState, useEffect } from 'react';
import Layout from '../layout/Layout';
import { http } from '../../api/http';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import '../../css/MemberDashboard.css';

const MembershipManagement = () => {
  const navigate = useNavigate();
  const [currentMembership, setCurrentMembership] = useState(null);
  const [membershipHistory, setMembershipHistory] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMembershipData();
  }, []);

  const fetchMembershipData = async () => {
    try {
      setLoading(true);
      const [membershipRes, historyRes, paymentsRes] = await Promise.all([
        http.get("/user-membership-plans/current"),
        http.get("/user-membership-plans/history"),
        http.get("/transactions/all-payments")
      ]);

      if (membershipRes.data.success) {
        setCurrentMembership(membershipRes.data.data);
      }

      if (historyRes.data.success) {
        setMembershipHistory(historyRes.data.data || []);
      }

      if (paymentsRes.data.success) {
        // Filter payments for current user
        const userPayments = (paymentsRes.data.data || []).filter(p =>
          p.userMembership?.user?._id || p.userMembership?.user
        );
        setPayments(userPayments);
      }
    } catch (error) {
      console.error("Error fetching membership data:", error);
      toast.error("Failed to load membership data");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAutoRenew = async () => {
    if (!currentMembership) {
      toast.error("No active membership found");
      return;
    }

    if (!window.confirm("Are you sure you want to cancel auto-renewal? Your membership will remain active until the end date.")) {
      return;
    }

    try {
      setLoading(true);
      const response = await http.patch(`/user-membership-plans/${currentMembership._id}/cancel-auto-renew`);
      if (response.data.success) {
        toast.success("Auto-renewal cancelled successfully. Your membership will remain active until the end date.");
        fetchMembershipData();
      } else {
        toast.error(response.data.message || "Failed to cancel auto-renewal");
      }
    } catch (error) {
      console.error("Error cancelling auto-renewal:", error);
      toast.error(error.response?.data?.message || "Failed to cancel auto-renewal");
    } finally {
      setLoading(false);
    }
  };

  const handleBuyRenewUpgrade = () => {
    navigate("/membership-plan");
  };

  const getPaymentMethod = (payment) => {
    if (payment.provider?.stripe) return "Stripe";
    if (payment.provider?.razorpay) return "Razorpay";
    return payment.paymentMethod || "Unknown";
  };

  const getPaymentStatus = (payment) => {
    return payment.status || "Unknown";
  };

  return (
    <Layout>
      <div className="member-dashboard">
        <div className="dashboard-header">
          <h1>My Membership</h1>
          <p>Manage your membership and view history</p>
        </div>

        {loading ? (
          <div className="loading">Loading membership data...</div>
        ) : (
          <>
            {/* Current Membership Card */}
            <div className="membership-section" style={{ marginBottom: "2rem" }}>
              <h2>Current Membership</h2>
              {currentMembership ? (
                <div className="membership-card" style={{
                  background: "#2a2a3b",
                  padding: "2rem",
                  borderRadius: "12px",
                  border: "1px solid #3a3a4a"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1.5rem" }}>
                    <div>
                      <h3 style={{ color: "#FFD700", marginBottom: "0.5rem" }}>
                        {currentMembership.membershipPlan?.title || "Membership Plan"}
                      </h3>
                      <p style={{ color: "#ccc" }}>{currentMembership.membershipPlan?.description || ""}</p>
                    </div>
                    <span className={`badge ${currentMembership.isActive ? "active" : "inactive"}`} style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                      background: currentMembership.isActive ? "#28a745" : "#6c757d",
                      color: "#fff"
                    }}>
                      {currentMembership.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                    <div>
                      <p style={{ color: "#ccc", marginBottom: "0.25rem" }}>Start Date</p>
                      <p style={{ color: "#fff", fontWeight: "bold" }}>
                        {new Date(currentMembership.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: "#ccc", marginBottom: "0.25rem" }}>End Date</p>
                      <p style={{ color: "#fff", fontWeight: "bold" }}>
                        {new Date(currentMembership.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: "#ccc", marginBottom: "0.25rem" }}>Total Price</p>
                      <p style={{ color: "#FFD700", fontWeight: "bold" }}>₹{currentMembership.totalPrice}</p>
                    </div>
                    <div>
                      <p style={{ color: "#ccc", marginBottom: "0.25rem" }}>Personal Trainer</p>
                      <p style={{ color: "#fff", fontWeight: "bold" }}>
                        {currentMembership.withPersonalTrainer ? "Yes" : "No"}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: "#ccc", marginBottom: "0.25rem" }}>Auto-Renew</p>
                      <p style={{ color: "#fff", fontWeight: "bold" }}>
                        {currentMembership.autoRenew !== false ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>

                  {currentMembership.membershipPlan?.benefits && (
                    <div style={{ marginBottom: "1.5rem" }}>
                      <p style={{ color: "#FFD700", marginBottom: "0.5rem", fontWeight: "bold" }}>Benefits:</p>
                      <ul style={{ color: "#ccc", paddingLeft: "1.5rem" }}>
                        {currentMembership.membershipPlan.benefits.map((benefit, idx) => (
                          <li key={idx}>{benefit}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                    <button
                      className="btn-primary"
                      onClick={handleBuyRenewUpgrade}
                      style={{
                        padding: "0.75rem 1.5rem",
                        background: "#FFD700",
                        color: "#1e1e2f",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "bold"
                      }}
                    >
                      {new Date(currentMembership.endDate) > new Date() ? "Renew/Upgrade" : "Buy New Plan"}
                    </button>
                    {currentMembership.isActive && currentMembership.autoRenew !== false && (
                      <button
                        className="btn-secondary"
                        onClick={handleCancelAutoRenew}
                        style={{
                          padding: "0.75rem 1.5rem",
                          background: "#6c757d",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontWeight: "bold"
                        }}
                      >
                        Cancel Auto-Renewal
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="empty-state" style={{
                  background: "#2a2a3b",
                  padding: "2rem",
                  borderRadius: "12px",
                  border: "1px solid #3a3a4a",
                  textAlign: "center"
                }}>
                  <p style={{ color: "#ccc", marginBottom: "1rem" }}>No active membership found.</p>
                  <button
                    className="btn-primary"
                    onClick={handleBuyRenewUpgrade}
                    style={{
                      padding: "0.75rem 1.5rem",
                      background: "#FFD700",
                      color: "#1e1e2f",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "bold"
                    }}
                  >
                    Buy Membership Plan
                  </button>
                </div>
              )}
            </div>

            {/* Membership History */}
            <div className="membership-history-section" style={{ marginBottom: "2rem" }}>
              <h2>Membership History</h2>
              {membershipHistory.length === 0 ? (
                <p style={{ color: "#ccc" }}>No previous memberships.</p>
              ) : (
                <div className="history-list" style={{
                  display: "grid",
                  gap: "1rem"
                }}>
                  {membershipHistory.map((membership) => (
                    <div key={membership._id} className="history-item" style={{
                      background: "#2a2a3b",
                      padding: "1.5rem",
                      borderRadius: "12px",
                      border: "1px solid #3a3a4a"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
                        <div>
                          <h4 style={{ color: "#FFD700", marginBottom: "0.5rem" }}>
                            {membership.membershipPlan?.title || "Membership Plan"}
                          </h4>
                          <p style={{ color: "#ccc" }}>
                            {new Date(membership.startDate).toLocaleDateString()} - {new Date(membership.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`badge ${membership.isActive ? "active" : "inactive"}`} style={{
                          padding: "0.5rem 1rem",
                          borderRadius: "6px",
                          background: membership.isActive ? "#28a745" : "#6c757d",
                          color: "#fff"
                        }}>
                          {membership.isActive ? "Active" : "Expired"}
                        </span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
                        <div>
                          <p style={{ color: "#ccc", fontSize: "0.9rem" }}>Price</p>
                          <p style={{ color: "#fff", fontWeight: "bold" }}>₹{membership.totalPrice}</p>
                        </div>
                        <div>
                          <p style={{ color: "#ccc", fontSize: "0.9rem" }}>Personal Trainer</p>
                          <p style={{ color: "#fff", fontWeight: "bold" }}>
                            {membership.withPersonalTrainer ? "Yes" : "No"}
                          </p>
                        </div>
                        <div>
                          <p style={{ color: "#ccc", fontSize: "0.9rem" }}>Auto-Renew</p>
                          <p style={{ color: "#fff", fontWeight: "bold" }}>
                            {membership.autoRenew !== false ? "Yes" : "No"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment History */}
            <div className="payment-history-section">
              <h2>Payment History</h2>
              {payments.length === 0 ? (
                <p style={{ color: "#ccc" }}>No payment history found.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-dark table-striped" style={{ width: "100%" }}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Payment Method</th>
                        <th>Status</th>
                        <th>Membership Plan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment._id}>
                          <td>
                            {payment.paymentDate
                              ? new Date(payment.paymentDate).toLocaleDateString()
                              : "N/A"}
                          </td>
                          <td>₹{payment.amount}</td>
                          <td>{getPaymentMethod(payment)}</td>
                          <td>
                            <span className={`badge ${getPaymentStatus(payment) === "Completed" ? "bg-success" : "bg-warning"}`}>
                              {getPaymentStatus(payment)}
                            </span>
                          </td>
                          <td>
                            {payment.userMembership?.membershipPlan?.title || "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default MembershipManagement;





