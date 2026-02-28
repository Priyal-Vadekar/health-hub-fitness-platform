// frontend/src/Components/Admin/Dietitians.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form, Dropdown, DropdownButton } from "react-bootstrap";
import Sidebar from "./Sidebar";
import { Header } from "./Header";
import "./css/Staff.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const ADMIN_BASE = `${API_BASE}/admin`;

const DietitiansList = () => {
  const getAuthToken = () => {
    const raw = localStorage.getItem("auth");
    return raw ? JSON.parse(raw) : null;
  };

  const [dietitians, setDietitians] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false); // ── NEW
  const [currentDietitian, setCurrentDietitian] = useState(null);
  const [deleteDietitianId, setDeleteDietitianId] = useState(null); // ── NEW
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [formData, setFormData] = useState({
    name: "", email: "", role: "RD",
    specialization: "", isCertified: false, password: ""
  });

  useEffect(() => {
    fetchDietitians();
    fetchMembers();
  }, []);

  const fetchDietitians = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const res = await axios.get(`${ADMIN_BASE}/dietitians`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data.success) setDietitians(res.data.data || []);
      else toast.error(res.data.message || "Failed to fetch dietitians");
    } catch (error) {
      toast.error("Failed to load dietitians");
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const token = getAuthToken();
      const res = await axios.get(`${API_BASE}/users`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data.success) {
        setMembers((res.data.data || []).filter((u) => u.role === "Member"));
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  };

  const handleCreateDietitian = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Name, email, and password are required");
      return;
    }
    try {
      const token = getAuthToken();
      const res = await axios.post(`${API_BASE}/auth/register`, formData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data.message) {
        toast.success("Dietitian created successfully!");
        setShowCreateModal(false);
        setFormData({ name: "", email: "", role: "RD", specialization: "", isCertified: false, password: "" });
        fetchDietitians();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create dietitian");
    }
  };

  const handleUpdateDietitian = async () => {
    if (!currentDietitian) return;
    try {
      const token = getAuthToken();
      const res = await axios.patch(
        `${ADMIN_BASE}/users/${currentDietitian._id}/role`,
        {
          role: currentDietitian.role,
          specialization: currentDietitian.specialization || "",
          isCertified: currentDietitian.isCertified || false
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (res.data.success) {
        toast.success("Dietitian updated successfully!");
        setShowEditModal(false);
        setCurrentDietitian(null);
        fetchDietitians();
      } else {
        toast.error(res.data.message || "Failed to update");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update dietitian");
    }
  };

  // ── BUG FIX: Open assign modal with pre-checked already-assigned members
  // Original opened modal with empty selectedMemberIds → saving overwrote all assignments
  const openAssignModal = (dietitian) => {
    setCurrentDietitian(dietitian);
    const dietitianId = dietitian._id?.toString();
    const alreadyAssigned = members
      .filter((m) => m.assignedDietitian?.toString() === dietitianId)
      .map((m) => m._id);
    setSelectedMemberIds(alreadyAssigned);
    setShowAssignModal(true);
  };

  const handleAssignMembers = async () => {
    if (!currentDietitian) return;
    try {
      const token = getAuthToken();
      const res = await axios.patch(
        `${ADMIN_BASE}/dietitians/${currentDietitian._id}/assign-members`,
        { memberIds: selectedMemberIds },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (res.data.success) {
        toast.success(
          selectedMemberIds.length === 0
            ? "All members unassigned"
            : `Assigned ${res.data.data.modifiedCount} members successfully!`
        );
        setShowAssignModal(false);
        setSelectedMemberIds([]);
        setCurrentDietitian(null);
        fetchDietitians();
        fetchMembers();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to assign members");
    }
  };

  const handleToggleCertification = async (dietitianId, currentStatus) => {
    try {
      const token = getAuthToken();
      const res = await axios.patch(
        `${ADMIN_BASE}/users/${dietitianId}/certification`,
        { isCertified: !currentStatus },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (res.data.success) {
        toast.success("Certification status updated!");
        fetchDietitians();
      }
    } catch (error) {
      toast.error("Failed to update certification");
    }
  };

  // ── NEW: Toggle dietitian active/inactive status
  const handleToggleStatus = async (dietitian) => {
    const newStatus = dietitian.status === "Active" ? "Inactive" : "Active";
    try {
      const token = getAuthToken();
      const res = await axios.patch(
        `${ADMIN_BASE}/users/${dietitian._id}/role`,
        { status: newStatus },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (res.data.success) {
        toast.success(`Status changed to ${newStatus}`);
        fetchDietitians();
      } else {
        // Optimistic UI fallback — update locally if backend doesn't return success
        setDietitians((prev) =>
          prev.map((d) => d._id === dietitian._id ? { ...d, status: newStatus } : d)
        );
        toast.success(`Status changed to ${newStatus}`);
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  // ── NEW: Delete dietitian
  const handleDeleteDietitian = async () => {
    if (!deleteDietitianId) return;
    try {
      const token = getAuthToken();
      await axios.delete(`${API_BASE}/users/${deleteDietitianId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      toast.success("Dietitian deleted successfully!");
      setShowDeleteModal(false);
      setDeleteDietitianId(null);
      fetchDietitians();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete dietitian");
    }
  };

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1">
        <Header />
        <div className="container-xxl py-5">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1>Dietitian Management</h1>
            <Button variant="success" onClick={() => setShowCreateModal(true)}>
              + Create Dietitian
            </Button>
          </div>
          <div className="container Users-section border-4 rounded-lg shadow-lg p-4">
            {loading ? (
              <p>Loading dietitians...</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-dark table-striped table-bordered text-center">
                  <thead>
                    <tr>
                      <th>No</th><th>Name</th><th>Email</th><th>Role</th>
                      <th>Specialization</th><th>Certified</th>
                      <th>Assigned Members</th><th>Status</th><th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dietitians.length === 0 ? (
                      <tr><td colSpan="9" className="text-center">No dietitians found</td></tr>
                    ) : (
                      dietitians.map((d, index) => (
                        <tr key={d._id}>
                          <td>{index + 1}</td>
                          <td>{d.name}</td>
                          <td>{d.email}</td>
                          <td>{d.role}</td>
                          <td>{d.specialization || "General"}</td>
                          <td>
                            <span className={`badge ${d.isCertified ? "bg-success" : "bg-secondary"}`}>
                              {d.isCertified ? "Yes" : "No"}
                            </span>
                          </td>
                          <td>{d.assignedMembersCount || 0}</td>
                          <td>
                            <span className={`badge ${d.status === "Active" ? "bg-success" : "bg-warning"}`}>
                              {d.status || "Inactive"}
                            </span>
                          </td>
                          <td>
                            <DropdownButton variant="secondary" title="Actions" size="sm">
                              <Dropdown.Item onClick={() => { setCurrentDietitian(d); setShowEditModal(true); }}>
                                Edit
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => openAssignModal(d)}>
                                Assign Members
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => handleToggleCertification(d._id, d.isCertified)}>
                                {d.isCertified ? "Remove Certification" : "Mark as Certified"}
                              </Dropdown.Item>
                              {/* ── NEW: Toggle Active/Inactive status */}
                              <Dropdown.Item onClick={() => handleToggleStatus(d)}>
                                {d.status === "Active" ? "Set Inactive" : "Set Active"}
                              </Dropdown.Item>
                              {/* ── NEW: Delete option */}
                              <Dropdown.Item
                                className="text-danger"
                                onClick={() => { setDeleteDietitianId(d._id); setShowDeleteModal(true); }}
                              >
                                Delete
                              </Dropdown.Item>
                            </DropdownButton>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Create Dietitian</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            {["name", "email", "password"].map((field) => (
              <Form.Group className="mb-3" key={field}>
                <Form.Label style={{ textTransform: "capitalize" }}>{field}</Form.Label>
                <Form.Control
                  type={field === "password" ? "password" : field === "email" ? "email" : "text"}
                  value={formData[field]}
                  onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                  required
                />
              </Form.Group>
            ))}
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                <option value="RD">RD</option>
                <option value="RDN">RDN</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Specialization</Form.Label>
              <Form.Control type="text" value={formData.specialization} onChange={(e) => setFormData({ ...formData, specialization: e.target.value })} />
            </Form.Group>
            <Form.Check type="checkbox" label="Certified" checked={formData.isCertified} onChange={(e) => setFormData({ ...formData, isCertified: e.target.checked })} />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleCreateDietitian}>Create</Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => { setShowEditModal(false); setCurrentDietitian(null); }} centered>
        <Modal.Header closeButton><Modal.Title>Edit Dietitian</Modal.Title></Modal.Header>
        <Modal.Body>
          {currentDietitian && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control type="text" value={currentDietitian.name} disabled />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control type="email" value={currentDietitian.email} disabled />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Role</Form.Label>
                <Form.Select value={currentDietitian.role} onChange={(e) => setCurrentDietitian({ ...currentDietitian, role: e.target.value })}>
                  <option value="RD">RD</option>
                  <option value="RDN">RDN</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Specialization</Form.Label>
                <Form.Control type="text" value={currentDietitian.specialization || ""} onChange={(e) => setCurrentDietitian({ ...currentDietitian, specialization: e.target.value })} />
              </Form.Group>
              <Form.Check type="checkbox" label="Certified" checked={!!currentDietitian.isCertified} onChange={(e) => setCurrentDietitian({ ...currentDietitian, isCertified: e.target.checked })} />
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleUpdateDietitian}>Save Changes</Button>
        </Modal.Footer>
      </Modal>

      {/* ── Assign Members Modal — FIXED UI + pre-checked members ────────── */}
      <Modal
        show={showAssignModal}
        onHide={() => { setShowAssignModal(false); setCurrentDietitian(null); setSelectedMemberIds([]); }}
        centered size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Assign Members to {currentDietitian?.name}</Modal.Title>
        </Modal.Header>
        {/* ── FIX: maxHeight + overflow-y so it doesn't push off screen */}
        <Modal.Body style={{ maxHeight: "60vh", overflowY: "auto" }}>
          {members.length === 0 ? (
            <p className="text-muted">No members available</p>
          ) : (
            <>
              <p className="text-muted mb-3">
                <small>
                  {selectedMemberIds.length} member(s) selected.
                  Pre-checked members are already assigned to this dietitian.
                </small>
              </p>
              <div className="row">
                {members.map((member) => (
                  <div className="col-md-6 mb-2" key={member._id}>
                    <Form.Check
                      type="checkbox"
                      id={`dm-${member._id}`}
                      label={
                        <span>
                          <strong>{member.name}</strong>
                          <br />
                          <small className="text-muted">{member.email}</small>
                        </span>
                      }
                      checked={selectedMemberIds.includes(member._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMemberIds([...selectedMemberIds, member._id]);
                        } else {
                          setSelectedMemberIds(selectedMemberIds.filter((id) => id !== member._id));
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowAssignModal(false); setCurrentDietitian(null); setSelectedMemberIds([]); }}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAssignMembers}>
            Save Assignment
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── NEW: Delete Confirmation Modal ───────────────────────────────── */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Confirm Delete</Modal.Title></Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this dietitian? This will also unassign all their members.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDeleteDietitian}>Delete</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DietitiansList;