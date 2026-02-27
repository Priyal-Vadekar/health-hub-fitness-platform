import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Modal, Button, Collapse, Dropdown, DropdownButton, Form } from "react-bootstrap";
import Sidebar from "./Sidebar";
import { Header } from "./Header";
import "./css/Staff.css";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const DietPlanList = () => {
  const [dietPlans, setDietPlans] = useState([]);
  const [filteredPlans, setFilteredPlans] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(2);
  const componentPDF = useRef();

  const [users, setUsers] = useState([]);
  const fetchUsers = async () => {
    try {
        const token = localStorage.getItem("auth");
        const response = await axios.get("http://localhost:5000/api/users", {
        headers: { Authorization: `Bearer ${token}` },
        });
        // Correctly access the 'data' array
        setUsers(response.data.data); // Assign users from 'data' property
    } catch (error) {
        console.error("Error fetching users:", error);
    }
    };

  useEffect(() => {
    fetchDietPlans();
    fetchUsers(); // <-- Add this
  }, []);;

const getTrainerInfo = (trainerRef) => {
  if (!trainerRef) return "N/A";
  if (typeof trainerRef === "object" && trainerRef.name) {
    return `${trainerRef.name} (${trainerRef.role || "Trainer"})`;
  }
  const user = Array.isArray(users) ? users.find((u) => u._id === trainerRef) : null;
  return user ? `${user.name} (${user.role})` : "N/A";
};

  useEffect(() => {
    if (!Array.isArray(dietPlans)) {
      setFilteredPlans([]);
      return;
    }
    const filtered = dietPlans.filter((plan) =>
      categoryFilter === "" || (plan.category && plan.category.toLowerCase().includes(categoryFilter.toLowerCase()))
    );
    setFilteredPlans(filtered);
  }, [categoryFilter, dietPlans]);

  const fetchDietPlans = async () => {
    try {
      setLoading(true);
      const rawToken = localStorage.getItem("auth");
      const token = rawToken ? JSON.parse(rawToken) : null;
      const response = await axios.get("http://localhost:5000/api/diet-plans/all-diet-plans", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const payload = response.data;
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

      if (!Array.isArray(list)) {
        throw new Error("Invalid diet plan response shape");
      }

      setDietPlans(list);
    } catch (error) {
      console.error("Error fetching diet plans:", error);
      toast.error(error.response?.data?.message || "Unable to load diet plans");
      setDietPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    const input = componentPDF.current;
    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 10, imgWidth, imgHeight);
      pdf.save("DietPlans.pdf");
    });
  };

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1">
        <Header />
        <div className="container-xxl py-5">
          <h1>Diet Plans</h1>
          <div className="container Users-section border-4 border-blue-500 rounded-lg shadow-lg p-4">
            {loading ? (
              <p>Loading Diet Plans...</p>
            ) : (
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <Button
                    variant="dark"
                    onClick={() => setFilterOpen(!filterOpen)}
                    aria-controls="filter-collapse"
                    aria-expanded={filterOpen}
                  >
                    {filterOpen ? "Hide Filters" : "Show Filters"}
                  </Button>
                  <Button className="pdf-btn mt-6" onClick={generatePDF}>
                    Generate PDF
                  </Button>
                  <Button  className="mt-6" style={{ backgroundColor: 'white'}}>
                    &emsp;&emsp;&emsp;&ensp;
                  </Button>
                </div>

                <Collapse in={filterOpen}>
                  <div id="filter-collapse" className="card p-3 mb-3 shadow-sm position-relative">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => setCategoryFilter("")}
                      className="position-absolute top-0 end-0 m-2"
                    >
                      Clear
                    </Button>
                    <Form.Group className="col-md-6 mt-3">
                      <Form.Label className="fw-semibold">Filter by Category</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter category"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="form-control border border-secondary"
                      />
                    </Form.Group>
                  </div>
                </Collapse>

                <div ref={componentPDF} className="table-responsive">
                  <table className="table table-dark table-striped table-bordered text-center">
                    <thead>
                      <tr>
                        <th>No</th>
                        <th>Category</th>
                        <th>Meals</th>
                        <th>Created By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPlans
                        .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
                        .map((plan, index) => (
                          <tr key={plan._id}>
                            <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                            <td>{plan.category}</td>
                            <td>
                              <ul className="text-start">
                                {(plan.meals || []).map((meal, i) => (
                                  <li key={i}>
                                    <strong>{meal.timeOfDay}:</strong>{" "}
                                    {meal.items.join(", ")}
                                  </li>
                                ))}
                              </ul>
                            </td>
                            <td>{plan.trainer?.name || getTrainerInfo(plan.trainer)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>

                  <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap">
                    <div className="mb-2">
                      <Form.Select
                        value={rowsPerPage}
                        onChange={(e) => {
                          setRowsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="form-control border border-secondary"
                        style={{ height: "45px" }}
                      >
                        <option value="2">Show 2 rows</option>
                        <option value="5">Show 5 rows</option>
                        <option value="10">Show 10 rows</option>
                        <option value="15">Show 15 rows</option>
                        <option value="20">Show 20 rows</option>
                      </Form.Select>
                    </div>
                    <div className="mb-2">
                      <Button
                        variant="secondary"
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="me-2"
                      >
                        Previous
                      </Button>
                      <span>
                        Page {currentPage} of{" "}
                        {Math.max(1, Math.ceil(filteredPlans.length / rowsPerPage))}
                      </span>
                      <Button
                        variant="secondary"
                        onClick={() =>
                          setCurrentPage((prev) =>
                            prev < Math.ceil(filteredPlans.length / rowsPerPage)
                              ? prev + 1
                              : prev
                          )
                        }
                        disabled={currentPage === Math.ceil(filteredPlans.length / rowsPerPage)}
                        className="ms-2"
                      >
                        Next
                      </Button>
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
