import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Modal,
  Button,
  Dropdown,
  DropdownButton,
  Form,
  Collapse,
} from "react-bootstrap";
import Sidebar from "./Sidebar";
import { Header } from "./Header";
import "./css/Staff.css";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const StaffList = () => {
  const [showAdd, setShowAdd] = useState(false);
  const [users, setUsers] = useState([]);
  const initialStaffState = {
    userId: "",
    role: "",
    specialty: "",
    description: "",
    image: null,
  };
  const [newStaff, setNewStaff] = useState(initialStaffState);
  const componentPDF = useRef();
  const [Staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentStaff, setCurrentStaff] = useState(null);
  const [deleteStaffId, setDeleteStaffId] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false); // State for collapse
  const [showCustomRoleInput, setShowCustomRoleInput] = useState(false);

  // Track specialty and name filters in state
  const [filteredStaffs, setFilteredStaffs] = useState([]);
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(2); // Default rows per page

  useEffect(() => {
    const fetchData = async () => {
      await fetchStaff(); // make sure this sets Staffs state
      await fetchUsers(); // your existing logic
    };
    fetchData();
  }, []);

  useEffect(() => {
    const filtered = Staffs.filter((Staff) => {
      const specialtyMatch = Staff.specialty
        ?.toLowerCase()
        .includes(specialtyFilter.toLowerCase());
      const nameMatch = Staff.user?.name
        ?.toLowerCase()
        .includes(nameFilter.toLowerCase());
      const roleMatch = roleFilter === "" || Staff?.role === roleFilter;
      return specialtyMatch && nameMatch && roleMatch;
    });
    setFilteredStaffs(filtered);
  }, [specialtyFilter, nameFilter, roleFilter, Staffs]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const filteredUsers = res.data.data.filter(
        (user) => user.role === "Trainer" || user.role === "Staff"
      );
      setUsers(filteredUsers);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/staff", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStaffs(response.data.data); // Set all staff here
    } catch (error) {
      console.error("Error fetching staff:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async () => {
    // Validate required fields
    if (!newStaff.userId) {
      toast.warn("Please select a user.");
      return;
    }
    if (!newStaff.specialty) {
      toast.warn("Please enter a specialty.");
      return;
    }
    // Add validation for role if it's required
    if (!newStaff.role) {
      toast.warn("Please select a role.");
      return;
    }
    if (!newStaff.image) {
      toast.warn("Please upload an image.");
      return;
    }

    // Check if user is already a staff member
    const isAlreadyStaff = Staffs.some(
      (staff) => staff.userId === newStaff.userId
    );
    if (isAlreadyStaff) {
      toast.warn("This user is already a staff member.");
      return;
    }

    const formData = new FormData();
    formData.append("userId", newStaff.userId);
    formData.append("specialty", newStaff.specialty);
    formData.append("description", newStaff.description);
    formData.append("role", newStaff.role); // Use the selected role from state
    formData.append("image", newStaff.image);

    console.log([...formData.entries()]); // Keep the log for debugging

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/staff/new-staff",
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setShowAdd(false);
        setNewStaff(initialStaffState);
        fetchStaff();
        toast.success("Staff added successfully!");
      } else {
        toast.error(response.data.message || "Failed to add staff.");
      }
    } catch (error) {
      console.error("Error adding Staff:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to add Staff. Please try again."
      );
    }
  };

  const deleteStaff = (id) => {
    setDeleteStaffId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(
        `http://localhost:5000/api/staff/delete-staff/${deleteStaffId}`
      );
      setStaffs((prev) => prev.filter((Staff) => Staff._id !== deleteStaffId));
      setShowDeleteModal(false);
      toast.success("Staff deleted successfully!");
    } catch (error) {
      console.error("Error deleting Staff:", error);
      toast.error("Failed to delete Staff.");
    }
  };

  const handleEdit = (Staff) => {
    setCurrentStaff(Staff);
    setShowEdit(true);
  };

  const handleSaveEdit = async () => {
    try {
      const token = localStorage.getItem("auth");
      const updated = {
        specialty: currentStaff.specialty,
        description: currentStaff.description,
      };
      await axios.patch(
        `http://localhost:5000/api/staff/update-staff/${currentStaff._id}`,
        updated,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setStaffs((prev) =>
        prev.map((t) => (t._id === currentStaff._id ? currentStaff : t))
      );
      toast.success("Staff updated successfully!");
      setShowEdit(false);
    } catch (error) {
      console.error("Error updating Staff:", error);
      toast.error("Failed to update Staff.");
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
      pdf.save("Staffs.pdf");
    });
  };

  // Add a function to check if a user is already a staff member
  const isUserStaff = (userId) =>
    Staffs.some((staff) => staff.user && staff.user._id === userId);

  // Update useEffect to refetch users when Staffs changes
  useEffect(() => {
    const fetchData = async () => {
      await fetchStaff(); // make sure this sets Staffs state
      await fetchUsers(); // fetch users after staff data is loaded
    };
    fetchData();
  }, []); // Remove Staffs from dependency array to prevent infinite loop

  // Add useEffect to update users when Staffs changes
  useEffect(() => {
    fetchUsers(); // Refetch users whenever Staffs changes
  }, [Staffs]); // Add Staffs as dependency

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1">
        <Header />
        <div className="container-xxl py-5">
          <h1> Staff Details </h1>
          <div className="container Staffs-section border-4 border-blue-500 rounded-lg shadow-lg p-4">
            {loading ? (
              <p className="loading-text">Loading Staffs...</p>
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
                  <Button className="pdf-btn mt-3" onClick={generatePDF}>
                    Generate PDF
                  </Button>
                  <Button variant="success" onClick={() => setShowAdd(true)}>
                    + Add Staff
                  </Button>
                </div>

                <Collapse in={filterOpen}>
                  <div
                    id="filter-collapse"
                    className="card p-3 mb-3 shadow-sm position-relative"
                  >
                    {/* Clear button at top right */}
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => {
                        setSpecialtyFilter("");
                        setNameFilter("");
                        setRoleFilter(""); // Clear role too
                      }}
                      className="position-absolute top-0 end-0 m-2"
                    >
                      Clear
                    </Button>
                    <br />

                    {/* Filter Form */}
                    <Form className="row g-3 align-items-end">
                      <Form.Group className="col-md-4">
                        <Form.Label className="fw-semibold">
                          Specialty
                        </Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Enter specialty"
                          value={specialtyFilter}
                          onChange={(e) => setSpecialtyFilter(e.target.value)}
                          className="form-control border border-secondary"
                        />
                      </Form.Group>
                      <Form.Group className="col-md-4">
                        <Form.Label className="fw-semibold">Name</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Enter name"
                          value={nameFilter}
                          onChange={(e) => setNameFilter(e.target.value)}
                          className="form-control border border-secondary"
                        />
                      </Form.Group>
                      <Form.Group
                        className="col-md-4"
                        style={{ paddingBottom: "1rem" }}
                      >
                        <Form.Label className="fw-semibold">
                          Filter by Role
                        </Form.Label>
                        <Form.Select
                          value={roleFilter}
                          onChange={(e) => setRoleFilter(e.target.value)}
                          className="form-control border border-secondary"
                          style={{ height: "56px" }}
                        >
                          <option value="">All Roles</option>
                          {[
                            ...new Set(
                              Staffs.map((staff) => staff?.role).filter(Boolean)
                            ),
                          ].map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Form>
                  </div>
                </Collapse>

                <div ref={componentPDF} className="table-responsive">
                  <table className="table table-dark table-striped table-bordered text-center w-100">
                    <thead>
                      <tr>
                        <th>No</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Specialty</th>
                        <th>Description</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStaffs
                        .slice(
                          (currentPage - 1) * rowsPerPage,
                          currentPage * rowsPerPage
                        )
                        .map((Staff, index) => (
                          <tr key={Staff._id}>
                            <td>
                              {(currentPage - 1) * rowsPerPage + index + 1}
                            </td>
                            <td>{Staff.user?.name || "Staff"}</td>
                            <td>{Staff.user?.email || "N/A"}</td>
                            <td>{Staff.role}</td>
                            <td>{Staff.specialty}</td>
                            <td>{Staff.description}</td>
                            <td>
                              <DropdownButton
                                variant="secondary"
                                title="Action"
                              >
                                <Dropdown.Item
                                  onClick={() => {
                                    setCurrentStaff(Staff);
                                    setShowDetails(true);
                                  }}
                                >
                                  Details
                                </Dropdown.Item>
                                <Dropdown.Item
                                  onClick={() => handleEdit(Staff)}
                                >
                                  Edit
                                </Dropdown.Item>
                                <Dropdown.Item
                                  onClick={() => deleteStaff(Staff._id)}
                                  className="text-danger"
                                >
                                  Delete
                                </Dropdown.Item>
                              </DropdownButton>
                            </td>
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
                          setCurrentPage(1); // Reset to first page when changing rows
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
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className="me-2"
                      >
                        Previous
                      </Button>
                      <span>
                        Page {currentPage} of{" "}
                        {Math.ceil(filteredStaffs.length / rowsPerPage)}
                      </span>
                      <Button
                        variant="secondary"
                        onClick={() =>
                          setCurrentPage((prev) =>
                            prev <
                            Math.ceil(filteredStaffs.length / rowsPerPage)
                              ? prev + 1
                              : prev
                          )
                        }
                        disabled={
                          currentPage ===
                          Math.ceil(filteredStaffs.length / rowsPerPage)
                        }
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

      {/* Modals (Add, Details, Edit) should follow here - already provided in your code. */}
      {/* Modal for Add */}
      <Modal
        show={showAdd}
        onHide={() => {
          setShowAdd(false);
          setNewStaff(initialStaffState);
        }}
        centered
        className="custom-scroll"
      >
        <Modal.Header closeButton>
          <Modal.Title>Add Staff</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form encType="multipart/form-data">
            <Form.Group controlId="formSelectUser" className="mb-3">
              <Form.Label>Select User (Trainer/Staff)</Form.Label>
              <Form.Control
                as="select"
                value={newStaff.userId}
                onChange={(e) =>
                  setNewStaff({ ...newStaff, userId: e.target.value })
                }
                required
              >
                <option value="">-- Select User --</option>
                {users.map((user) => {
                  const alreadyStaff = isUserStaff(user._id);
                  return (
                    <option
                      key={user._id}
                      value={user._id}
                      disabled={alreadyStaff}
                    >
                      {user.name} ({user.role})
                      {alreadyStaff ? " - Already Added" : ""}
                    </option>
                  );
                })}
              </Form.Control>
              <Form.Text className="text-muted">
                Only users with Trainer or Staff roles can be added as staff
                members. Users who are already staff members are disabled.
              </Form.Text>
            </Form.Group>

            <Form.Group controlId="formRole">
              <Form.Label>Role</Form.Label>
              <Form.Control
                as="select"
                value={newStaff.role}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "add_new") {
                    setShowCustomRoleInput(true);
                    setNewStaff({ ...newStaff, role: "" });
                  } else {
                    setShowCustomRoleInput(false);
                    setNewStaff({ ...newStaff, role: value });
                  }
                }}
              >
                <option value="">-- Select Role --</option>
                {[
                  ...new Set(
                    Staffs.map((staff) => staff?.role).filter(Boolean)
                  ),
                ].map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
                <option value="add_new">+ Add New Role</option>
              </Form.Control>
            </Form.Group>

            {showCustomRoleInput && (
              <Form.Group controlId="customRoleInput">
                <Form.Label>New Role</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter new role"
                  value={newStaff.role}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, role: e.target.value })
                  }
                />
              </Form.Group>
            )}

            <Form.Group controlId="formSpecialty">
              <Form.Label>Specialty</Form.Label>
              <Form.Control
                type="text"
                value={newStaff.specialty}
                onChange={(e) =>
                  setNewStaff({ ...newStaff, specialty: e.target.value })
                }
                placeholder="Specialty"
              />
            </Form.Group>

            <Form.Group controlId="formDescription">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                value={newStaff.description}
                onChange={(e) =>
                  setNewStaff({ ...newStaff, description: e.target.value })
                }
                rows={3}
                placeholder="Description"
                style={{
                  resize: "none",
                  overflowY: "auto",
                  maxHeight: "200px",
                }}
              />
            </Form.Group>

            {/* Image Upload Field */}
            <Form.Group controlId="formImage">
              <Form.Label>Staff Image</Form.Label>
              <Form.Control
                type="file"
                onChange={(e) =>
                  setNewStaff({
                    ...newStaff,
                    image: e.target.files[0], // Store the file object
                  })
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleAddStaff}>
            Add Staff
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal for Details */}
      <Modal
        show={showDetails}
        onHide={() => setShowDetails(false)}
        centered
        className="custom-scroll"
      >
        <Modal.Header closeButton>
          <Modal.Title>Staff Details</Modal.Title>
        </Modal.Header>
        <Modal.Body ref={componentPDF}>
          <div className="Staff-details">
            <div className="Staff-image d-flex justify-content-center">
              {currentStaff?.image && (
                <img
                  src={`/Images/${currentStaff?.image}`}
                  alt={`${currentStaff?.user?.name}`}
                  className="img-fluid"
                  style={{
                    width: "200px",
                    height: "200px",
                    objectFit: "cover",
                    borderRadius: "50%",
                  }}
                />
              )}
            </div>
            <br />
            <p>
              <strong>Name:</strong> {currentStaff?.user?.name}
            </p>
            <p>
              <strong>Email:</strong> {currentStaff?.user?.email}
            </p>
            <p>
              <strong>Role:</strong> {currentStaff?.role}
            </p>
            <p>
              <strong>Specialty:</strong> {currentStaff?.specialty}
            </p>
            <p>
              <strong>Description:</strong> {currentStaff?.description}
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button className="pdf-btn mt-3" onClick={generatePDF}>
            Generate PDF
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal for Edit */}
      <Modal
        show={showEdit}
        onHide={() => setShowEdit(false)}
        centered
        className="custom-scroll"
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Staff</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formStaffName">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={currentStaff?.user?.name || ""}
                onChange={(e) =>
                  setCurrentStaff({
                    ...currentStaff,
                    user: { ...currentStaff.user, name: e.target.value },
                  })
                }
                disabled
              />
            </Form.Group>

            <Form.Group controlId="formRole">
              <Form.Label>Role</Form.Label>
              <Form.Control
                as="select"
                value={currentStaff?.role || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "add_new") {
                    setShowCustomRoleInput(true);
                    setCurrentStaff({ ...currentStaff, role: "" });
                  } else {
                    setShowCustomRoleInput(false);
                    setCurrentStaff({ ...currentStaff, role: value });
                  }
                }}
              >
                <option value="">-- Select Role --</option>
                {[
                  ...new Set(
                    Staffs.map((staff) => staff?.role).filter(Boolean)
                  ),
                ].map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
                <option value="add_new">+ Add New Role</option>
              </Form.Control>
            </Form.Group>

            {showCustomRoleInput && (
              <Form.Group controlId="customRoleInput">
                <Form.Label>New Role</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter new role"
                  value={currentStaff?.role || ""}
                  onChange={(e) =>
                    setCurrentStaff({ ...currentStaff, role: e.target.value })
                  }
                />
              </Form.Group>
            )}

            <Form.Group controlId="formStaffSpecialty">
              <Form.Label>Specialty</Form.Label>
              <Form.Control
                type="text"
                value={currentStaff?.specialty || ""}
                onChange={(e) =>
                  setCurrentStaff({
                    ...currentStaff,
                    specialty: e.target.value,
                  })
                }
              />
            </Form.Group>
            <Form.Group controlId="formStaffDescription">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                value={currentStaff?.description || ""}
                onChange={(e) =>
                  setCurrentStaff({
                    ...currentStaff,
                    description: e.target.value,
                  })
                }
                rows={3}
                style={{
                  resize: "none",
                  overflowY: "auto",
                  maxHeight: "200px",
                }}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleSaveEdit}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
        className="custom-scroll"
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this Staff?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default StaffList;
