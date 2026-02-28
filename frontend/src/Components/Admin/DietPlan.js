// frontend/src/Components/Admin/DietPlan.js
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Modal, Button, Collapse, Form } from "react-bootstrap";
import Sidebar from "./Sidebar";
import { Header } from "./Header";
import "./css/Staff.css";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "react-toastify";

const DietPlanList = () => {
  const [dietPlans, setDietPlans] = useState([]);
  const [filteredPlans, setFilteredPlans] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  // Track which rows have their meals expanded
  const [expandedRows, setExpandedRows] = useState({});
  const componentPDF = useRef();

  useEffect(() => {
    fetchDietPlans();
  }, []);

  useEffect(() => {
    if (!Array.isArray(dietPlans)) { setFilteredPlans([]); return; }
    const filtered = dietPlans.filter((plan) =>
      categoryFilter === "" ||
      plan.category?.toLowerCase().includes(categoryFilter.toLowerCase())
    );
    setFilteredPlans(filtered);
    setCurrentPage(1);
  }, [categoryFilter, dietPlans]);

  const fetchDietPlans = async () => {
    try {
      setLoading(true);
      const raw = localStorage.getItem("auth");
      const token = raw ? JSON.parse(raw) : null;
      const response = await axios.get(
        "http://localhost:5000/api/diet-plans/all-diet-plans",
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      const payload = response.data;
      const list = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
      setDietPlans(list);
    } catch (error) {
      toast.error("Unable to load diet plans");
      setDietPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    html2canvas(componentPDF.current, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      pdf.addImage(imgData, "PNG", 0, 10, 210, (canvas.height * 210) / canvas.width);
      pdf.save("DietPlans.pdf");
    });
  };

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const paginated = filteredPlans.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  const totalPages = Math.max(1, Math.ceil(filteredPlans.length / rowsPerPage));

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1">
        <Header />
        <div className="container-xxl py-5">
          <h1>Diet Plans</h1>
          <div className="container Users-section border-4 rounded-lg shadow-lg p-4">
            {loading ? (
              <p>Loading Diet Plans...</p>
            ) : (
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <Button variant="dark" onClick={() => setFilterOpen(!filterOpen)}>
                    {filterOpen ? "Hide Filters" : "Show Filters"}
                  </Button>
                  <Button className="pdf-btn" onClick={generatePDF}>Generate PDF</Button>
                  <div style={{ width: 120 }} />
                </div>

                <Collapse in={filterOpen}>
                  <div className="card p-3 mb-3 shadow-sm position-relative">
                    <Button
                      variant="outline-secondary" size="sm"
                      onClick={() => setCategoryFilter("")}
                      className="position-absolute top-0 end-0 m-2"
                    >Clear</Button>
                    <Form.Group className="col-md-6 mt-3">
                      <Form.Label>Filter by Category</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="e.g. Weight Gain"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                      />
                    </Form.Group>
                  </div>
                </Collapse>

                <div ref={componentPDF} className="table-responsive">
                  {/* ── UI FIX: Show meal count + expand button instead of full bullet list
                      Original rendered ALL meal items inline → rows became massive walls of text
                      Now shows: Category | Meal Count | "View" button → expand in-row | Created By */}
                  <table className="table table-dark table-striped table-bordered">
                    <thead>
                      <tr>
                        <th style={{ width: 40 }}>No</th>
                        <th>Category</th>
                        <th style={{ width: 150 }}>Meals</th>
                        <th>Created By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.length === 0 ? (
                        <tr><td colSpan="4" className="text-center">No diet plans found</td></tr>
                      ) : (
                        paginated.map((plan, index) => (
                          <React.Fragment key={plan._id}>
                            <tr>
                              <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                              <td><strong>{plan.category}</strong></td>
                              <td>
                                <Button
                                  variant="outline-warning"
                                  size="md"
                                  onClick={() => toggleRow(plan._id)}
                                >
                                  {expandedRows[plan._id] ? "Hide" : `View (${plan.meals?.length || 0})`}
                                </Button>
                              </td>
                              <td>{plan.trainer?.name || "Admin"}</td>
                            </tr>
                            {/* Expandable meal detail row */}
                            {expandedRows[plan._id] && (
                              <tr>
                                <td colSpan="4" style={{ background: "#1a1a2e", padding: "16px 24px" }}>
                                  <div className="row g-3">
                                    {(plan.meals || []).map((meal, i) => (
                                      <div className="col-md-4" key={i}>
                                        <div
                                          style={{
                                            background: "#23233a",
                                            borderRadius: 8,
                                            padding: "12px 16px",
                                            borderLeft: "3px solid #FFD700"
                                          }}
                                        >
                                          <p style={{ color: "#FFD700", fontWeight: "bold", marginBottom: 6 }}>
                                            {meal.timeOfDay}
                                          </p>
                                          <ul style={{ paddingLeft: 16, marginBottom: 0, textAlign: "left" }}>
                                            {meal.items.map((item, j) => (
                                              <li key={j} style={{ color: "#ccc", fontSize: 13 }}>{item}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))
                      )}
                    </tbody>
                  </table>

                  <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap">
                    <Form.Select
                      value={rowsPerPage}
                      onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                      className="form-control border border-secondary w-auto"
                      style={{ height: "45px" }}
                    >
                      {[5, 10, 15, 20].map((n) => <option key={n} value={n}>Show {n} rows</option>)}
                    </Form.Select>
                    <div>
                      <Button variant="secondary" onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} className="me-2">Previous</Button>
                      <span>Page {currentPage} of {totalPages}</span>
                      <Button variant="secondary" onClick={() => setCurrentPage((p) => p < totalPages ? p + 1 : p)} disabled={currentPage === totalPages} className="ms-2">Next</Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DietPlanList;