
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Modal, Button, Dropdown, DropdownButton, Form, Collapse } from "react-bootstrap";
import Sidebar from "./Sidebar";
import { Header } from "./Header";
import "./css/Staff.css";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const UserList = () => {
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
  const ADMIN_BASE = `${API_BASE}/admin`;
  const getAuthToken = () => {
    const raw = localStorage.getItem("auth");
    return raw ? JSON.parse(raw) : null;
  };
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [nameFilter, setNameFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const componentPDF = useRef();

  const [showAdd, setShowAdd] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [dietitians, setDietitians] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [memberOptions, setMemberOptions] = useState([]);
  const [showAssignDietitianModal, setShowAssignDietitianModal] = useState(false);
  const [showAssignTrainerModal, setShowAssignTrainerModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedDietitianId, setSelectedDietitianId] = useState("");
  const [selectedTrainerId, setSelectedTrainerId] = useState("");

  useEffect(() => {
    fetchUsers();
    fetchDietitians();
    fetchTrainersList();
  }, []);

  useEffect(() => {
    const members = users.filter((user) => user.role === "Member");
    setMemberOptions(members);
  }, [users]);

  useEffect(() => {
    const filtered = users.filter(user => {
      const nameMatch = user.name?.toLowerCase().includes(nameFilter.toLowerCase());
      const roleMatch = roleFilter === "" || user.role === roleFilter;
      return nameMatch && roleMatch;
    });
    setFilteredUsers(filtered);
  }, [nameFilter, roleFilter, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const res = await axios.get(`${API_BASE}/users`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.data.success) {
        setUsers(res.data.data);
      } else {
        toast.error(res.data.message || "Failed to fetch users");
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      toast.error("Could not load users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    setDeleteUserId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const token = getAuthToken();
      await axios.delete(`${API_BASE}/users/${deleteUserId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setUsers(prev => prev.filter(user => user._id !== deleteUserId));
      setShowDeleteModal(false);
      toast.success("User deleted successfully!");
    } catch (err) {
      console.error("Error deleting user:", err);
      toast.error("Failed to delete user.");
    }
  };

  const fetchDietitians = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;
      const res = await axios.get(`${ADMIN_BASE}/dietitians`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setDietitians(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching dietitians:", error);
    }
  };

  const fetchTrainersList = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;
      const res = await axios.get(`${API_BASE}/staff/trainers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setTrainers(res.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching trainers:", error);
    }
  };

  const openAssignDietitian = (member) => {
    setSelectedMember(member);
    setSelectedDietitianId(member.assignedDietitian?._id || member.assignedDietitian || "");
    setShowAssignDietitianModal(true);
  };

  const openAssignTrainer = (member) => {
    setSelectedMember(member);
    setSelectedTrainerId(member.assignedTrainer?._id || member.assignedTrainer || "");
    setShowAssignTrainerModal(true);
  };

  const handleAssignDietitian = async () => {
    if (!selectedDietitianId) {
      toast.error("Please select a dietitian");
      return;
    }
    try {
      const token = getAuthToken();
      await axios.patch(
        `${ADMIN_BASE}/users/${selectedMember._id}/assign-dietitian`,
        { dietitianId: selectedDietitianId },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setUsers((prev) =>
        prev.map((user) =>
          user._id === selectedMember._id
            ? { ...user, assignedDietitian: selectedDietitianId }
            : user
        )
      );
      toast.success("Dietitian assigned successfully!");
      setShowAssignDietitianModal(false);
      setSelectedDietitianId("");
    } catch (error) {
      console.error("Error assigning dietitian:", error);
      toast.error(error.response?.data?.message || "Failed to assign dietitian");
    }
  };

  const handleAssignTrainer = async () => {
    if (!selectedTrainerId) {
      toast.error("Please select a trainer");
      return;
    }
    try {
      const token = getAuthToken();
      await axios.patch(
        `${ADMIN_BASE}/users/${selectedMember._id}/assign-trainer`,
        { trainerId: selectedTrainerId },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setUsers((prev) =>
        prev.map((user) =>
          user._id === selectedMember._id
            ? { ...user, assignedTrainer: selectedTrainerId }
            : user
        )
      );
      toast.success("Trainer assigned successfully!");
      setShowAssignTrainerModal(false);
      setSelectedTrainerId("");
    } catch (error) {
      console.error("Error assigning trainer:", error);
      toast.error(error.response?.data?.message || "Failed to assign trainer");
    }
  };

  const handleSaveEdit = async () => {
    if (!currentUser || !currentUser._id) {
      toast.error("No user selected");
      return;
    }

    if (!currentUser.role) {
      toast.error("Role is required");
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const payload = { role: currentUser.role };
      if (["RD", "RDN"].includes(currentUser.role)) {
        payload.specialization = currentUser.specialization || "";
      }
      if (typeof currentUser.isCertified === "boolean") {
        payload.isCertified = currentUser.isCertified;
      }

      const res = await axios.patch(`${ADMIN_BASE}/users/${currentUser._id}/role`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        const updatedUser = res.data.data || res.data.user || currentUser;
        setUsers(prev => prev.map(u => u._id === updatedUser._id ? updatedUser : u));
        toast.success("User updated successfully!");
        setShowEdit(false);
        setCurrentUser(null);
        fetchUsers(); // Refresh users list
      } else {
        toast.error(res.data.message || "Failed to update user.");
      }
    } catch (err) {
      console.error("Error updating user:", err);
      toast.error(err.response?.data?.message || "Failed to update user.");
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
      pdf.save("Users.pdf");
    });
  };

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1">
        <Header />
        <div className="container-xxl py-5">
          <h1>User Details</h1>
          <div className="container Users-section border-4 border-blue-500 rounded-lg shadow-lg p-4">
            {loading ? <p>Loading Users...</p> : (
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <Button variant="dark" onClick={() => setFilterOpen(!filterOpen)}>
                    {filterOpen ? "Hide Filters" : "Show Filters"}
                  </Button>
                  <Button className="pdf-btn mt-3" onClick={generatePDF}>Generate PDF</Button>
                  <Button style={{ backgroundColor: 'white' }}>
                    &emsp;&emsp;&emsp;&ensp;
                  </Button>
                </div>

                <Collapse in={filterOpen}>
                  <div className="card p-3 mb-3">
                    <Button variant="outline-secondary" size="sm" onClick={() => { setNameFilter(""); setRoleFilter(""); }} className="position-absolute top-0 end-0 m-2">Clear</Button>
                    <Form className="row g-3">
                      <Form.Group className="col-md-4">
                        <Form.Label>Name</Form.Label>
                        <Form.Control type="text" value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} placeholder="Enter name" />
                      </Form.Group>
                      <Form.Group className="col-md-4" style={{ paddingBottom: '1rem' }}>
                        <Form.Label>Role</Form.Label>
                        <Form.Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ height: '56px' }}>
                          <option value="">All Roles</option>
                          {["Staff", "Admin", "Trainer", "Member", "RD", "RDN"].map((role) => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Form>
                  </div>
                </Collapse>

                <div ref={componentPDF} className="table-responsive">
                  <table className="table table-dark table-striped table-bordered text-center">
                    <thead>
                      <tr>
                        <th>No</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((user, index) => (
                        <tr key={user._id}>
                          <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                          <td>{user.name}</td>
                          <td>{user.email}</td>
                          <td>{user.role}</td>
                          <td>
                            <DropdownButton variant="secondary" title="Actions" size="sm">
                              <Dropdown.Item onClick={() => { setCurrentUser(user); setShowDetails(true); }}>View</Dropdown.Item>
                              <Dropdown.Item onClick={() => { setCurrentUser(user); setShowEdit(true); }}>Edit</Dropdown.Item>
                              {user.role === "Member" && (
                                <>
                                  <Dropdown.Item onClick={() => openAssignDietitian(user)}>Assign Dietitian</Dropdown.Item>
                                  <Dropdown.Item onClick={() => openAssignTrainer(user)}>Assign Trainer</Dropdown.Item>
                                </>
                              )}
                              <Dropdown.Item className="text-danger" onClick={() => handleDelete(user._id)}>Delete</Dropdown.Item>
                            </DropdownButton>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap">
                    <Form.Select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }} style={{ width: '150px' }}>
                      {[2, 5, 10, 15, 20].map((count) => (
                        <option key={count} value={count}>Show {count} rows</option>
                      ))}
                    </Form.Select>
                    <div>
                      <Button variant="dark" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Previous</Button>
                      <span className="mx-2">Page {currentPage} of {Math.ceil(filteredUsers.length / rowsPerPage)}</span>
                      <Button variant="dark" onClick={() => setCurrentPage(p => p < Math.ceil(filteredUsers.length / rowsPerPage) ? p + 1 : p)} disabled={currentPage === Math.ceil(filteredUsers.length / rowsPerPage)}>Next</Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        <Modal show={showDetails} onHide={() => setShowDetails(false)} centered>
          <Modal.Header closeButton><Modal.Title>User Details</Modal.Title></Modal.Header>
          <Modal.Body>
            {currentUser && (
              <>
                <p><strong>Name:</strong> {currentUser.name}</p>
                <p><strong>Email:</strong> {currentUser.email}</p>
                <p><strong>Role:</strong> {currentUser.role}</p>
              </>
            )}
          </Modal.Body>
        </Modal>

        <Modal show={showEdit} onHide={() => setShowEdit(false)} centered className="custom-scroll">
          <Modal.Header closeButton><Modal.Title>Edit User</Modal.Title></Modal.Header>
          <Modal.Body>
            {currentUser && (
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control type="text" value={currentUser.name} onChange={(e) => setCurrentUser({ ...currentUser, name: e.target.value })} disabled />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" value={currentUser.email} onChange={(e) => setCurrentUser({ ...currentUser, email: e.target.value })} disabled />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Role</Form.Label>
                  <Form.Select value={currentUser.role} onChange={(e) => setCurrentUser({ ...currentUser, role: e.target.value })}>
                    <option value="Admin">Admin</option>
                    <option value="Staff">Staff</option>
                    <option value="Trainer">Trainer</option>
                    <option value="RD">RD (Dietitian)</option>
                    <option value="RDN">RDN (Dietitian)</option>
                    <option value="Member">Member</option>
                  </Form.Select>
                </Form.Group>
                {["RD", "RDN"].includes(currentUser.role) && (
                  <Form.Group className="mt-3">
                    <Form.Label>Specialization</Form.Label>
                    <Form.Control
                      type="text"
                      value={currentUser.specialization || ""}
                      onChange={(e) => setCurrentUser({ ...currentUser, specialization: e.target.value })}
                      placeholder="e.g., Weight Loss, Sports"
                    />
                  </Form.Group>
                )}
                {["Trainer", "RD", "RDN"].includes(currentUser.role) && (
                  <Form.Group className="mt-3">
                    <Form.Check
                      type="checkbox"
                      label="Certified"
                      checked={!!currentUser.isCertified}
                      onChange={(e) => setCurrentUser({ ...currentUser, isCertified: e.target.checked })}
                    />
                  </Form.Group>
                )}
              </Form>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </Modal.Footer>
        </Modal>

        {/* Assign Dietitian Modal */}
        <Modal show={showAssignDietitianModal} onHide={() => setShowAssignDietitianModal(false)} centered>
          <Modal.Header closeButton><Modal.Title>Assign Dietitian</Modal.Title></Modal.Header>
          <Modal.Body>
            <Form.Group>
              <Form.Label>Select Dietitian</Form.Label>
              <Form.Select
                value={selectedDietitianId}
                onChange={(e) => setSelectedDietitianId(e.target.value)}
              >
                <option value="">-- Select Dietitian --</option>
                {dietitians.map((dietitian) => (
                  <option key={dietitian._id} value={dietitian._id}>
                    {dietitian.name} ({dietitian.role}) - {dietitian.specialization || "General"}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAssignDietitianModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAssignDietitian}>Assign</Button>
          </Modal.Footer>
        </Modal>

        {/* Assign Trainer Modal */}
        <Modal show={showAssignTrainerModal} onHide={() => setShowAssignTrainerModal(false)} centered>
          <Modal.Header closeButton><Modal.Title>Assign Trainer</Modal.Title></Modal.Header>
          <Modal.Body>
            <Form.Group>
              <Form.Label>Select Trainer</Form.Label>
              <Form.Select
                value={selectedTrainerId}
                onChange={(e) => setSelectedTrainerId(e.target.value)}
              >
                <option value="">-- Select Trainer --</option>
                {trainers.map((trainer) => (
                  <option key={trainer._id} value={trainer.user?._id}>
                    {trainer.user?.name || "Trainer"} ({trainer.specialty || "General"})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAssignTrainerModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAssignTrainer}>Assign</Button>
          </Modal.Footer>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
          <Modal.Header>
            <Modal.Title>Confirm Delete</Modal.Title>
          </Modal.Header>
          <Modal.Body>Are you sure you want to delete this user?</Modal.Body>
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
    </div>
  );
};

export default UserList;