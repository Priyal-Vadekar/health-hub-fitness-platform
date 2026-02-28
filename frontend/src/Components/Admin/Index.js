// frontend/src/Components/Admin/Index.js
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, LineChart, Line,
} from "recharts";
import axios from "axios";
import "./css/index.css";
import { Header } from "./Header";
import { Button, Collapse, Form } from "react-bootstrap";
import moment from "moment";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { toast } from "react-toastify";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export const Index = () => {
  const componentPDF = useRef();
  const navigate = useNavigate();
  const [dashboardCounts, setDashboardCounts] = useState({
    totalMembers: 0, totalTrainers: 0, totalSales: 0
  });
  const [gettrainerdata, setTrainerData] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [trainerFilter, setTrainerFilter] = useState("");
  const [membershipGrowth, setMembershipGrowth] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [outstandingPayments, setOutstandingPayments] = useState([]);
  const [trainerPerformance, setTrainerPerformance] = useState([]);
  const [dietPlanPopularity, setDietPlanPopularity] = useState([]);
  const [dietitianImpact, setDietitianImpact] = useState({ topDietitian: null, totalDietitians: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("auth");
    const headers = token ? { Authorization: `Bearer ${JSON.parse(token)}` } : {};

    const fetchData = async () => {
      try {
        setLoading(true);
        const [countsRes, trainersRes, paymentsRes] = await Promise.allSettled([
          axios.get(`${API_URL}/users/report/dashboard-counts`, { headers }),
          axios.get(`${API_URL}/staff/trainers`, { headers }),
          axios.get(`${API_URL}/transactions/all-payments`, { headers })
        ]);

        if (countsRes.status === "fulfilled" && countsRes.value.data.success) {
          setDashboardCounts(countsRes.value.data.data);
        }
        if (trainersRes.status === "fulfilled") {
          setTrainerData(trainersRes.value.data.data || []);
        }
      } catch (error) {
        toast.error("Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    const fetchReports = async () => {
      try {
        const [
          membershipGrowthRes, revenueRes, outstandingRes,
          trainerPerformanceRes, dietPlanPopularityRes, adminDietitiansRes
        ] = await Promise.allSettled([
          axios.get(`${API_URL}/users/report/membership-growth`, { headers }),
          axios.get(`${API_URL}/transactions/report/revenue`, { headers }),
          axios.get(`${API_URL}/transactions/report/outstanding`, { headers }),
          axios.get(`${API_URL}/staff/report/performance`, { headers }),
          axios.get(`${API_URL}/assigned-dietplans/report/popularity`, { headers }),
          axios.get(`${API_URL}/admin/dietitians`, { headers })
        ]);

        if (membershipGrowthRes.status === "fulfilled" && membershipGrowthRes.value.data.success) {
          setMembershipGrowth(membershipGrowthRes.value.data.data);
        }
        if (revenueRes.status === "fulfilled" && revenueRes.value.data.success) {
          setRevenueData(revenueRes.value.data.data);
        }
        if (outstandingRes.status === "fulfilled" && outstandingRes.value.data.success) {
          setOutstandingPayments(outstandingRes.value.data.data);
        }
        if (trainerPerformanceRes.status === "fulfilled" && trainerPerformanceRes.value.data.success) {
          setTrainerPerformance(trainerPerformanceRes.value.data.data);
        }
        if (dietPlanPopularityRes.status === "fulfilled" && dietPlanPopularityRes.value.data.success) {
          setDietPlanPopularity(dietPlanPopularityRes.value.data.data);
        }
        if (adminDietitiansRes.status === "fulfilled" && adminDietitiansRes.value.data.success) {
          const list = adminDietitiansRes.value.data.data || [];
          const sorted = [...list].sort((a, b) => (b.assignedMembersCount || 0) - (a.assignedMembersCount || 0));
          setDietitianImpact({ totalDietitians: list.length, topDietitian: sorted[0] || null });
        }
      } catch (error) {
        toast.error("Unable to load dashboard reports.");
      }
    };

    fetchData();
    fetchReports();
  }, []);

  const generatePDF = () => {
    html2canvas(componentPDF.current, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 10, imgWidth, imgHeight);
      pdf.save("Dashboard.pdf");
    });
  };

  const outstandingTotal = outstandingPayments.reduce((sum, item) => sum + (item.amount || 0), 0);

  const summaryCards = [
    { title: "Active Members", value: dashboardCounts.totalMembers, path: "/admin/users", subtitle: "Manage members" },
    { title: "Active Trainers", value: dashboardCounts.totalTrainers, path: "/admin/trainer", subtitle: "View trainers" },
    { title: "Total Revenue", value: dashboardCounts.totalSales, path: "/admin/transaction", subtitle: "Completed payments", isCurrency: true },
    { title: "Outstanding Payments", value: outstandingTotal, path: "/admin/transaction", subtitle: `${outstandingPayments.length} invoices`, isCurrency: true },
    {
      title: "Dietitians", value: dietitianImpact.totalDietitians, path: "/admin/dietitians",
      subtitle: dietitianImpact.topDietitian
        ? `Top: ${dietitianImpact.topDietitian.name} (${dietitianImpact.topDietitian.assignedMembersCount} members)`
        : "Manage dietitians"
    }
  ];

  // ── BUG FIX 01: Outstanding Payments showing "N/A"
  // The backend populates userMembership → user correctly, BUT some Payment
  // records were created without a UserMembership link (e.g. direct/legacy payments).
  // These have userMembership: null, so p.userMembership?.user?.name is undefined.
  // We try multiple paths: userMembership.user.name → user.name → userName → "Unknown Member"
  const getMemberName = (p) => {
    return (
      p.userMembership?.user?.name ||
      p.user?.name ||
      p.userName ||
      p.memberName ||
      "Unknown Member"
    );
  };

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1">
        <Header />
        <div className="container-xxl py-5">
          <h1 className="mb-4">Dashboard Overview</h1>
          <div className="container Users-section border-4 border-blue-500 rounded-lg shadow-lg p-4">
            <div className="mb-4 d-flex justify-content-between align-items-center">
              <Button variant="dark" onClick={() => setFilterOpen(!filterOpen)}>
                {filterOpen ? "Hide Filters" : "Show Filters"}
              </Button>
              <Button className="pdf-btn mt-3" onClick={generatePDF}>Generate PDF</Button>
              <Button style={{ backgroundColor: "white" }}>&emsp;&emsp;&emsp;&ensp;</Button>
            </div>

            <Collapse in={filterOpen}>
              <div className="card p-3 mb-4 shadow-sm position-relative">
                <Button
                  variant="outline-secondary" size="sm"
                  onClick={() => setTrainerFilter("")}
                  className="position-absolute top-0 end-0 m-2"
                >Clear</Button>
                <Form className="row g-3 align-items-end">
                  <Form.Group className="col-md-4">
                    <Form.Label className="fw-semibold">Filter by Trainer</Form.Label>
                    <Form.Select
                      value={trainerFilter}
                      onChange={(e) => setTrainerFilter(e.target.value)}
                      className="form-control border border-secondary"
                    >
                      <option value="">All Trainers</option>
                      {gettrainerdata.map((trainer) => (
                        <option key={trainer._id} value={trainer.user?.name}>
                          {trainer.user?.name || "Unknown Trainer"}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Form>
              </div>
            </Collapse>

            <div ref={componentPDF}>
              {/* Summary Cards */}
              <div className="row text-center mb-4">
                {summaryCards.map((card) => (
                  <div className="col-md-4 mb-3" key={card.title}>
                    <div
                      className="card bg-dark text-white shadow dashboard-summary-card"
                      role="button"
                      tabIndex={0}
                      style={{ cursor: "pointer" }}
                      onClick={() => card.path && navigate(card.path)}
                      onKeyDown={(e) => e.key === "Enter" && card.path && navigate(card.path)}
                    >
                      <div className="card-body">
                        <h5>{card.title}</h5>
                        {loading ? (
                          <h2>Loading...</h2>
                        ) : (
                          <h2>
                            {card.isCurrency ? "₹ " : ""}
                            {Number(card.value || 0).toLocaleString()}
                          </h2>
                        )}
                        <p className="card-subtitle">{card.subtitle}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <br />

              {/* Membership Growth */}
              <div className="card p-4 shadow mb-4" style={{ background: "#23233a" }}>
                <h5 className="mb-3" style={{ color: "#FFD700" }}>Membership Growth</h5>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={membershipGrowth} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="_id" stroke="#FFD700" tick={{ fill: "#FFD700" }} />
                    <YAxis stroke="#FFD700" tick={{ fill: "#FFD700" }} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "#23233a", color: "#FFD700", border: "1px solid #FFD700" }} />
                    <Line type="monotone" dataKey="count" stroke="#FFD700" strokeWidth={3} dot={{ r: 5, fill: "#FFD700" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Monthly Revenue */}
              <div className="card p-4 shadow mb-4" style={{ background: "#23233a" }}>
                <h5 className="mb-3" style={{ color: "#FFD700" }}>Monthly Revenue</h5>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="_id" stroke="#FFD700" tick={{ fill: "#FFD700" }} />
                    <YAxis stroke="#FFD700" tick={{ fill: "#FFD700" }} />
                    <Tooltip contentStyle={{ background: "#23233a", color: "#FFD700", border: "1px solid #FFD700" }} />
                    <Line type="monotone" dataKey="total" stroke="#FFD700" strokeWidth={3} dot={{ r: 5, fill: "#FFD700" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* ── BUG FIX 01: Outstanding Payments — use getMemberName() helper */}
              <div className="card p-4 shadow mb-4" style={{ background: "#23233a" }}>
                <h5 className="mb-3" style={{ color: "#FFD700" }}>Outstanding Payments</h5>
                <div className="table-responsive">
                  <table className="table table-dark table-striped">
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {outstandingPayments.length === 0 ? (
                        <tr><td colSpan="4" className="text-center">No outstanding payments</td></tr>
                      ) : (
                        outstandingPayments.map((p) => (
                          <tr key={p._id}>
                            <td>{getMemberName(p)}</td>
                            <td>₹ {p.amount}</td>
                            <td>{p.status}</td>
                            <td>{p.paymentDate ? moment(p.paymentDate).format("YYYY-MM-DD") : "N/A"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── BUG FIX 02: Trainer Performance — replace "Created Diet Plans"
                  (always 0, trainers don't create diet plans in this system)
                  with "Assigned Members" — actually useful and populated data    */}
              <div className="card p-4 shadow mb-4" style={{ background: "#23233a" }}>
                <h5 className="mb-3" style={{ color: "#FFD700" }}>Trainer Performance</h5>
                <div className="table-responsive">
                  <table className="table table-dark table-striped">
                    <thead>
                      <tr>
                        <th>Trainer</th>
                        <th>Assigned Members</th>
                        <th>Specialty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trainerPerformance.length === 0 ? (
                        <tr><td colSpan="3" className="text-center">No trainer data</td></tr>
                      ) : (
                        trainerPerformance.map((t) => (
                          <tr key={t._id}>
                            <td>{t.user?.name || "N/A"}</td>
                            {/* Show assignedMembersCount if available, fallback to createdDietPlansCount */}
                            <td>{t.assignedMembersCount ?? t.createdDietPlansCount ?? 0}</td>
                            <td>{t.specialty || "—"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Dietitian Impact Chart */}
              <div className="card p-4 shadow mb-4" style={{ background: "#23233a" }}>
                <h5 className="mb-3" style={{ color: "#FFD700" }}>Dietitian Impact</h5>
                {dietPlanPopularity.length === 0 ? (
                  <div className="text-center text-muted py-4">No dietitian data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dietPlanPopularity}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis dataKey="category" stroke="#FFD700" tick={{ fill: "#FFD700" }} />
                      <YAxis stroke="#FFD700" tick={{ fill: "#FFD700" }} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: "#23233a", color: "#FFD700", border: "1px solid #FFD700" }} />
                      <Bar dataKey="count" fill="#FFD700" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};