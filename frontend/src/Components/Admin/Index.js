import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
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
    totalMembers: 0,
    totalTrainers: 0,
    totalSales: 0
  });
  const [getuserdata, setUserData] = useState([]);
  const [gettrainerdata, setTrainerData] = useState([]);
  const [getsalesdata, setSalesData] = useState([]);
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
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("auth");
        const headers = token ? { Authorization: `Bearer ${JSON.parse(token)}` } : {};

        // Fetch dashboard counts efficiently
        const [countsRes, usersRes, trainersRes, paymentsRes] = await Promise.allSettled([
          axios.get(`${API_URL}/users/report/dashboard-counts`, { headers }),
          axios.get(`${API_URL}/users/`, { headers }),
          axios.get(`${API_URL}/staff/trainers`, { headers }),
          axios.get(`${API_URL}/transactions/all-payments`, { headers })
        ]);

        // Handle dashboard counts
        if (countsRes.status === 'fulfilled' && countsRes.value.data.success) {
          setDashboardCounts(countsRes.value.data.data);
        } else {
          console.error("Failed to fetch dashboard counts:", countsRes.reason);
        }

        // Handle users data
        if (usersRes.status === 'fulfilled') {
          const allUsers = usersRes.value.data.data || [];
          const membersOnly = allUsers.filter(user => user.role === 'Member');
          setUserData(membersOnly);
        } else {
          console.error("Failed to fetch users:", usersRes.reason);
        }

        // Handle trainers data
        if (trainersRes.status === 'fulfilled') {
          setTrainerData(trainersRes.value.data.data || []);
        } else {
          console.error("Failed to fetch trainers:", trainersRes.reason);
        }

        // Handle payments data
        if (paymentsRes.status === 'fulfilled') {
          setSalesData(paymentsRes.value.data.data || []);
        } else {
          console.error("Failed to fetch payments:", paymentsRes.reason);
        }

      } catch (error) {
        console.error("Error in fetchData:", error);
        toast.error("Unable to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Fetch additional reports
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem("auth");
        const headers = token ? { Authorization: `Bearer ${JSON.parse(token)}` } : {};

        // Fetch all reports in parallel with error handling
        const [
          membershipGrowthRes,
          revenueRes,
          outstandingRes,
          trainerPerformanceRes,
          dietPlanPopularityRes,
          adminDietitiansRes
        ] = await Promise.allSettled([
          axios.get(`${API_URL}/users/report/membership-growth`, { headers }),
          axios.get(`${API_URL}/transactions/report/revenue`, { headers }),
          axios.get(`${API_URL}/transactions/report/outstanding`, { headers }),
          axios.get(`${API_URL}/staff/report/performance`, { headers }),
          axios.get(`${API_URL}/assigned-dietplans/report/popularity`, { headers }),
          axios.get(`${API_URL}/admin/dietitians`, { headers })
        ]);

        // Handle each report result
        if (membershipGrowthRes.status === 'fulfilled' && membershipGrowthRes.value.data.success) {
          setMembershipGrowth(membershipGrowthRes.value.data.data);
        } else {
          console.error("Failed to fetch membership growth:", membershipGrowthRes.reason);
        }

        if (revenueRes.status === 'fulfilled' && revenueRes.value.data.success) {
          setRevenueData(revenueRes.value.data.data);
        } else {
          console.error("Failed to fetch revenue data:", revenueRes.reason);
        }

        if (outstandingRes.status === 'fulfilled' && outstandingRes.value.data.success) {
          setOutstandingPayments(outstandingRes.value.data.data);
        } else {
          console.error("Failed to fetch outstanding payments:", outstandingRes.reason);
        }

        if (trainerPerformanceRes.status === 'fulfilled' && trainerPerformanceRes.value.data.success) {
          setTrainerPerformance(trainerPerformanceRes.value.data.data);
        } else {
          console.error("Failed to fetch trainer performance:", trainerPerformanceRes.reason);
        }

        if (dietPlanPopularityRes.status === 'fulfilled' && dietPlanPopularityRes.value.data.success) {
          setDietPlanPopularity(dietPlanPopularityRes.value.data.data);
        } else {
          console.error("Failed to fetch diet plan popularity:", dietPlanPopularityRes.reason);
        }

        if (adminDietitiansRes.status === 'fulfilled' && adminDietitiansRes.value.data.success) {
          const list = adminDietitiansRes.value.data.data || [];
          const sorted = [...list].sort((a, b) => (b.assignedMembersCount || 0) - (a.assignedMembersCount || 0));
          setDietitianImpact({
            totalDietitians: list.length,
            topDietitian: sorted[0] || null
          });
        } else {
          console.error("Failed to fetch dietitians:", adminDietitiansRes.reason);
        }

      } catch (error) {
        console.error("Error fetching reports:", error);
        toast.error("Unable to load dashboard reports. Please try again.");
      }
    };

    fetchReports();
  }, []);

  const generatePDF = () => {
    const input = componentPDF.current;
    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 10, imgWidth, imgHeight);
      pdf.save("Dashboard.pdf");
    });
  };

  // Use dashboard counts directly for better performance
  const totaluser = dashboardCounts.totalMembers;
  const totaltrainer = dashboardCounts.totalTrainers;
  const totalsales = dashboardCounts.totalSales;
  const outstandingTotal = outstandingPayments.reduce((sum, item) => sum + (item.amount || 0), 0);
  const summaryCards = [
    {
      title: "Active Members",
      value: totaluser,
      path: "/admin/users",
      subtitle: "Manage members"
    },
    {
      title: "Active Trainers",
      value: totaltrainer,
      path: "/admin/trainer",
      subtitle: "View trainers"
    },
    {
      title: "Total Revenue",
      value: totalsales,
      path: "/admin/transaction",
      subtitle: "Completed payments",
      isCurrency: true
    },
    {
      title: "Outstanding Payments",
      value: outstandingTotal,
      path: "/admin/transaction",
      subtitle: `${outstandingPayments.length} invoices`,
      isCurrency: true
    },
    {
      title: "Dietitians",
      value: dietitianImpact.totalDietitians,
      path: "/admin/dietitians",
      subtitle: dietitianImpact.topDietitian
        ? `Top: ${dietitianImpact.topDietitian.name} (${dietitianImpact.topDietitian.assignedMembersCount} members)`
        : "Manage dietitians"
    }
  ];

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
              <Button style={{ backgroundColor: 'white'}}>
                &emsp;&emsp;&emsp;&ensp;
              </Button>
            </div>

            <Collapse in={filterOpen}>
              <div className="card p-3 mb-4 shadow-sm position-relative">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => setTrainerFilter("")}
                  className="position-absolute top-0 end-0 m-2"
                >
                  Clear
                </Button>
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
              <div className="row text-center mb-4">
                {summaryCards.map((card) => (
                  <div className="col-md-4 mb-3" key={card.title}>
                    <div
                      className="card bg-dark text-white shadow dashboard-summary-card"
                      role="button"
                      tabIndex={0}
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        if (card.path) {
                          navigate(card.path);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && card.path) {
                          navigate(card.path);
                        }
                      }}
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

              {/* <div className="card p-4 shadow bg-white">
                <h5 className="mb-3">Monthly Bookings</h5>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={(entry) => moment(entry.date).format("MMM")} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#007bff" />
                  </BarChart>
                </ResponsiveContainer>
              </div> */}
              <br/><br/>
              {/* Membership Growth Line Chart */}
              <div className="card p-4 shadow mb-4" style={{ background: "#23233a" }}>
                <h5 className="mb-3" style={{ color: "#FFD700" }}>Membership Growth</h5>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={membershipGrowth} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="_id" stroke="#FFD700" tick={{ fill: '#FFD700' }} />
                    <YAxis stroke="#FFD700" tick={{ fill: '#FFD700' }} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: '#23233a', color: '#FFD700', border: '1px solid #FFD700' }} />
                    <Line type="monotone" dataKey="count" stroke="#FFD700" strokeWidth={3} dot={{ r: 5, fill: '#FFD700' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Revenue Line Chart */}
              <div className="card p-4 shadow mb-4" style={{ background: "#23233a" }}>
                <h5 className="mb-3" style={{ color: "#FFD700" }}>Monthly Revenue</h5>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="_id" stroke="#FFD700" tick={{ fill: '#FFD700' }} />
                    <YAxis stroke="#FFD700" tick={{ fill: '#FFD700' }} />
                    <Tooltip contentStyle={{ background: '#23233a', color: '#FFD700', border: '1px solid #FFD700' }} />
                    <Line type="monotone" dataKey="total" stroke="#FFD700" strokeWidth={3} dot={{ r: 5, fill: '#FFD700' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Outstanding Payments Table */}
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
                            <td>{p.userMembership?.user?.name || "N/A"}</td>
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

              {/* Trainer Performance Table */}
              <div className="card p-4 shadow mb-4" style={{ background: "#23233a" }}>
                <h5 className="mb-3" style={{ color: "#FFD700" }}>Trainer Performance</h5>
                <div className="table-responsive">
                  <table className="table table-dark table-striped">
                    <thead>
                      <tr>
                        <th>Trainer</th>
                        <th>Created Diet Plans</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trainerPerformance.length === 0 ? (
                        <tr><td colSpan="2" className="text-center">No data</td></tr>
                      ) : (
                        trainerPerformance.map((t) => (
                          <tr key={t._id}>
                            <td>{t.user?.name || "N/A"}</td>
                            <td>{t.createdDietPlansCount}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Dietitian Impact */}
              <div className="card p-4 shadow mb-4" style={{ background: "#23233a" }}>
                <h5 className="mb-3" style={{ color: "#FFD700" }}>Dietitian Impact</h5>
                {dietPlanPopularity.length === 0 ? (
                  <div className="text-center text-muted py-4">No dietitian data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dietPlanPopularity}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis dataKey="category" stroke="#FFD700" tick={{ fill: '#FFD700' }} />
                      <YAxis stroke="#FFD700" tick={{ fill: '#FFD700' }} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: '#23233a', color: '#FFD700', border: '1px solid #FFD700' }} />
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
