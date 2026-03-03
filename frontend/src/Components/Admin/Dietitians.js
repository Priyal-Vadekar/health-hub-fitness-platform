// frontend/src/Components/Admin/Dietitians.js
//
// ── STATUS FIELD NOTE ─────────────────────────────────────────────────────────
// The User model does NOT have a "status" field (only name, email, role,
// isCertified, specialization etc). Two options:
//
// OPTION A (recommended, no DB migration): Toggle "isCertified" badge as a
// quick Active/Inactive proxy — but that conflates two different concepts.
//
// OPTION B (correct, requires 1-line User model change):
// Add this to UserSchema:
//   isActive: { type: Boolean, default: true }
// Then use PATCH /api/admin/users/:id/role with body { isActive: false }
// The updateUserRole controller already uses $set so it will accept any field.
//
// This file implements OPTION B. Add `isActive` to User model to enable it.
// The UI shows "Active" / "Inactive" badge and the toggle will work immediately
// after you add the field. If you haven't added it yet, it shows "Active" by default.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from "react";
import { FiCheck } from "react-icons/fi";
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
  const authHeaders = () => {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const [dietitians, setDietitians] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentDietitian, setCurrentDietitian] = useState(null);
  const [deleteDietitianId, setDeleteDietitianId] = useState(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [formData, setFormData] = useState({
    name: "", email: "", role: "RD", specialization: "", isCertified: false, password: ""
  });

  useEffect(() => {
    fetchDietitians();
    fetchMembers();
  }, []);

  const fetchDietitians = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${ADMIN_BASE}/dietitians`, { headers: authHeaders() });
      if (res.data.success) setDietitians(res.data.data || []);
      else toast.error(res.data.message || "Failed to fetch dietitians");
    } catch (e) {
      toast.error("Failed to load dietitians");
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/users`, { headers: authHeaders() });
      if (res.data.success) {
        setMembers((res.data.data || []).filter((u) => u.role === "Member"));
      }
    } catch (e) {
      console.error("Error fetching members:", e);
    }
  };

  const handleCreateDietitian = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Name, email and password are required");
      return;
    }
    try {
      const res = await axios.post(`${API_BASE}/auth/register`, formData, { headers: authHeaders() });
      if (res.data.message) {
        toast.success("Dietitian created!");
        setShowCreateModal(false);
        setFormData({ name: "", email: "", role: "RD", specialization: "", isCertified: false, password: "" });
        fetchDietitians();
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to create");
    }
  };

  const handleUpdateDietitian = async () => {
    if (!currentDietitian) return;
    try {
      const res = await axios.patch(
        `${ADMIN_BASE}/users/${currentDietitian._id}/role`,
        { role: currentDietitian.role, specialization: currentDietitian.specialization || "", isCertified: currentDietitian.isCertified || false },
        { headers: authHeaders() }
      );
      if (res.data.success) {
        toast.success("Updated!");
        setShowEditModal(false);
        fetchDietitians();
      } else toast.error(res.data.message);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to update");
    }
  };

  // Pre-check currently assigned members when opening modal
  const openAssignModal = (d) => {
    setCurrentDietitian(d);
    setMemberSearch("");
    const did = d._id?.toString();
    const already = members.filter((m) => m.assignedDietitian?.toString() === did).map((m) => m._id);
    setSelectedMemberIds(already);
    setShowAssignModal(true);
  };

  const handleAssignMembers = async () => {
    if (!currentDietitian) return;
    try {
      const res = await axios.patch(
        `${ADMIN_BASE}/dietitians/${currentDietitian._id}/assign-members`,
        { memberIds: selectedMemberIds },
        { headers: authHeaders() }
      );
      if (res.data.success) {
        toast.success(selectedMemberIds.length === 0 ? "All members unassigned" : `${res.data.data.modifiedCount} members assigned!`);
        setShowAssignModal(false);
        setCurrentDietitian(null);
        setSelectedMemberIds([]);
        fetchDietitians();
        fetchMembers();
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to assign");
    }
  };

  const handleToggleCertification = async (d) => {
    try {
      const res = await axios.patch(
        `${ADMIN_BASE}/users/${d._id}/certification`,
        { isCertified: !d.isCertified },
        { headers: authHeaders() }
      );
      if (res.data.success) { toast.success("Certification updated!"); fetchDietitians(); }
    } catch (e) {
      toast.error("Failed to update certification");
    }
  };

  // ── STATUS TOGGLE: uses isActive boolean on User model (add to UserSchema)
  // PATCH /api/admin/users/:id/role with { isActive: bool } 
  // The existing updateUserRole controller uses $set so it handles any field
  const handleToggleStatus = async (d) => {
    const newIsActive = !(d.isActive !== false); // default true if field missing
    try {
      await axios.patch(
        `${ADMIN_BASE}/users/${d._id}/role`,
        { isActive: newIsActive },
        { headers: authHeaders() }
      );
      toast.success(`Status set to ${newIsActive ? "Active" : "Inactive"}`);
      // Optimistic update
      setDietitians((prev) => prev.map((x) => x._id === d._id ? { ...x, isActive: newIsActive } : x));
    } catch (e) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!deleteDietitianId) return;
    try {
      await axios.delete(`${API_BASE}/users/${deleteDietitianId}`, { headers: authHeaders() });
      toast.success("Dietitian deleted!");
      setShowDeleteModal(false);
      setDeleteDietitianId(null);
      fetchDietitians();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to delete");
    }
  };

  const isActive = (d) => d.isActive !== false; // true by default if field not in DB yet

  // Filtered members for search inside assign modal
  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(memberSearch.toLowerCase())
  );

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1">
        <Header />
        <div className="container-xxl py-5">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1>Dietitian Management</h1>
            <Button variant="success" onClick={() => setShowCreateModal(true)}>+ Create Dietitian</Button>
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
                      dietitians.map((d, i) => (
                        <tr key={d._id}>
                          <td>{i + 1}</td>
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
                            <span className={`badge ${isActive(d) ? "bg-success" : "bg-warning text-dark"}`}>
                              {isActive(d) ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td>
                            <DropdownButton variant="secondary" title="Actions" size="sm">
                              <Dropdown.Item onClick={() => { setCurrentDietitian(d); setShowEditModal(true); }}>Edit</Dropdown.Item>
                              <Dropdown.Item onClick={() => openAssignModal(d)}>Assign Members</Dropdown.Item>
                              <Dropdown.Item onClick={() => handleToggleCertification(d)}>
                                {d.isCertified ? "Remove Certification" : "Mark Certified"}
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => handleToggleStatus(d)}>
                                {isActive(d) ? "Set Inactive" : "Set Active"}
                              </Dropdown.Item>
                              <Dropdown.Divider />
                              <Dropdown.Item className="text-danger" onClick={() => { setDeleteDietitianId(d._id); setShowDeleteModal(true); }}>
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
            {[["name", "text", "Name"], ["email", "email", "Email"], ["password", "password", "Password"]].map(([f, t, l]) => (
              <Form.Group className="mb-3" key={f}>
                <Form.Label>{l} <span className="text-danger">*</span></Form.Label>
                <Form.Control type={t} value={formData[f]} onChange={(e) => setFormData({ ...formData, [f]: e.target.value })} />
              </Form.Group>
            ))}
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                <option value="RD">RD (Registered Dietitian)</option>
                <option value="RDN">RDN (Registered Dietitian Nutritionist)</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Specialization</Form.Label>
              <Form.Control type="text" value={formData.specialization} onChange={(e) => setFormData({ ...formData, specialization: e.target.value })} placeholder="e.g. Weight Loss, Sports" />
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
              <Form.Group className="mb-3"><Form.Label>Name</Form.Label><Form.Control type="text" value={currentDietitian.name} disabled /></Form.Group>
              <Form.Group className="mb-3"><Form.Label>Email</Form.Label><Form.Control type="email" value={currentDietitian.email} disabled /></Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Role</Form.Label>
                <Form.Select value={currentDietitian.role} onChange={(e) => setCurrentDietitian({ ...currentDietitian, role: e.target.value })}>
                  <option value="RD">RD</option><option value="RDN">RDN</option>
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

      {/* Assign Members Modal — FIXED UI: grid layout, search, scrollable */}
      <Modal
        show={showAssignModal}
        onHide={() => { setShowAssignModal(false); setCurrentDietitian(null); setSelectedMemberIds([]); setMemberSearch(""); }}
        centered size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Assign Members — {currentDietitian?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: "16px 24px" }}>
          {/* Summary bar */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="text-muted" style={{ fontSize: 13 }}>
              {selectedMemberIds.length} of {members.length} selected
            </span>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setSelectedMemberIds([])}
            >
              Clear All
            </Button>
          </div>

          {/* Search */}
          <Form.Control
            type="text"
            placeholder="Search members by name or email..."
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            className="mb-3"
          />

          {/* Member grid — scrollable */}
          <div style={{ maxHeight: "50vh", overflowY: "auto", overflowX: "hidden" }}>
            {filteredMembers.length === 0 ? (
              <p className="text-muted text-center">No members found</p>
            ) : (
              <div className="row g-2">
                {filteredMembers.map((member) => {
                  const checked = selectedMemberIds.includes(member._id);
                  return (
                    <div className="col-md-6" key={member._id}>
                      <div
                        className="d-flex align-items-center gap-2 p-2 rounded"
                        style={{
                          background: checked ? "#1a3a1a" : "#1e1e2e",
                          border: `1px solid ${checked ? "#28a745" : "#444"}`,
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                        onClick={() => {
                          if (checked) {
                            setSelectedMemberIds((prev) => prev.filter((id) => id !== member._id));
                          } else {
                            setSelectedMemberIds((prev) => [...prev, member._id]);
                          }
                        }}
                      >
                        {/* Checkbox visual */}
                        <div
                          style={{
                            width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                            background: checked ? "#28a745" : "transparent",
                            border: `2px solid ${checked ? "#28a745" : "#888"}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >
                          {checked && <FiCheck size={11} style={{ color: "#fff" }} />}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: "#fff", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {member.name}
                          </div>
                          <div style={{ color: "#aaa", fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {member.email}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowAssignModal(false); setCurrentDietitian(null); setSelectedMemberIds([]); setMemberSearch(""); }}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAssignMembers}>
            Save Assignment ({selectedMemberIds.length} selected)
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Confirm Delete</Modal.Title></Modal.Header>
        <Modal.Body><p>Are you sure? This will also unassign all their members.</p></Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DietitiansList;