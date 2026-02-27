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
  const [currentDietitian, setCurrentDietitian] = useState(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "RD",
    specialization: "",
    isCertified: false,
    password: ""
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
      if (res.data.success) {
        setDietitians(res.data.data || []);
      } else {
        toast.error(res.data.message || "Failed to fetch dietitians");
      }
    } catch (error) {
      console.error("Error fetching dietitians:", error);
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
        const memberList = (res.data.data || []).filter(u => u.role === "Member");
        setMembers(memberList);
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
      const res = await axios.post(`${API_BASE}/auth/register`, {
        ...formData,
        role: formData.role
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (res.data.message) {
        toast.success("Dietitian created successfully!");
        setShowCreateModal(false);
        setFormData({ name: "", email: "", role: "RD", specialization: "", isCertified: false, password: "" });
        fetchDietitians();
      }
    } catch (error) {
      console.error("Error creating dietitian:", error);
      toast.error(error.response?.data?.message || "Failed to create dietitian");
    }
  };

  const handleUpdateDietitian = async () => {
    if (!currentDietitian) return;

    try {
      const token = getAuthToken();
      const payload = {
        role: currentDietitian.role,
        specialization: currentDietitian.specialization || "",
        isCertified: currentDietitian.isCertified || false
      };

      const res = await axios.patch(`${ADMIN_BASE}/users/${currentDietitian._id}/role`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (res.data.success) {
        toast.success("Dietitian updated successfully!");
        setShowEditModal(false);
        setCurrentDietitian(null);
        fetchDietitians();
      } else {
        toast.error(res.data.message || "Failed to update dietitian");
      }
    } catch (error) {
      console.error("Error updating dietitian:", error);
      toast.error(error.response?.data?.message || "Failed to update dietitian");
    }
  };

  const handleAssignMembers = async () => {
    if (!currentDietitian || selectedMemberIds.length === 0) {
      toast.error("Please select at least one member");
      return;
    }

    try {
      const token = getAuthToken();
      const res = await axios.patch(
        `${ADMIN_BASE}/dietitians/${currentDietitian._id}/assign-members`,
        { memberIds: selectedMemberIds },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      if (res.data.success) {
        toast.success(`Assigned ${res.data.data.modifiedCount} members successfully!`);
        setShowAssignModal(false);
        setSelectedMemberIds([]);
        setCurrentDietitian(null);
        fetchDietitians();
        fetchMembers();
      }
    } catch (error) {
      console.error("Error assigning members:", error);
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
      console.error("Error updating certification:", error);
      toast.error("Failed to update certification");
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
          <div className="container Users-section border-4 border-blue-500 rounded-lg shadow-lg p-4">
            {loading ? (
              <p>Loading dietitians...</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-dark table-striped table-bordered text-center">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Specialization</th>
                      <th>Certified</th>
                      <th>Assigned Members</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dietitians.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="text-center">No dietitians found</td>
                      </tr>
                    ) : (
                      dietitians.map((dietitian, index) => (
                        <tr key={dietitian._id}>
                          <td>{index + 1}</td>
                          <td>{dietitian.name}</td>
                          <td>{dietitian.email}</td>
                          <td>{dietitian.role}</td>
                          <td>{dietitian.specialization || "General"}</td>
                          <td>
                            <span className={`badge ${dietitian.isCertified ? "bg-success" : "bg-secondary"}`}>
                              {dietitian.isCertified ? "Yes" : "No"}
                            </span>
                          </td>
                          <td>{dietitian.assignedMembersCount || 0}</td>
                          <td>
                            <span className={`badge ${dietitian.status === "Active" ? "bg-success" : "bg-warning"}`}>
                              {dietitian.status || "Inactive"}
                            </span>
                          </td>
                          <td>
                            <DropdownButton variant="secondary" title="Actions" size="sm">
                              <Dropdown.Item onClick={() => { setCurrentDietitian(dietitian); setShowEditModal(true); }}>
                                Edit
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => { setCurrentDietitian(dietitian); setShowAssignModal(true); }}>
                                Assign Members
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => handleToggleCertification(dietitian._id, dietitian.isCertified)}>
                                {dietitian.isCertified ? "Remove Certification" : "Mark as Certified"}
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

      {/* Create Dietitian Modal */}
      <Modal show={showCreateModal} onHide={() => { setShowCreateModal(false); setFormData({ name: "", email: "", role: "RD", specialization: "", isCertified: false, password: "" }); }} centered>
        <Modal.Header closeButton>
          <Modal.Title>Create Dietitian</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="RD">RD (Registered Dietitian)</option>
                <option value="RDN">RDN (Registered Dietitian Nutritionist)</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Specialization</Form.Label>
              <Form.Control
                type="text"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                placeholder="e.g., Weight Loss, Sports"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Certified"
                checked={formData.isCertified}
                onChange={(e) => setFormData({ ...formData, isCertified: e.target.checked })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleCreateDietitian}>Create</Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Dietitian Modal */}
      <Modal show={showEditModal} onHide={() => { setShowEditModal(false); setCurrentDietitian(null); }} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Dietitian</Modal.Title>
        </Modal.Header>
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
                <Form.Select
                  value={currentDietitian.role}
                  onChange={(e) => setCurrentDietitian({ ...currentDietitian, role: e.target.value })}
                >
                  <option value="RD">RD</option>
                  <option value="RDN">RDN</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Specialization</Form.Label>
                <Form.Control
                  type="text"
                  value={currentDietitian.specialization || ""}
                  onChange={(e) => setCurrentDietitian({ ...currentDietitian, specialization: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Certified"
                  checked={!!currentDietitian.isCertified}
                  onChange={(e) => setCurrentDietitian({ ...currentDietitian, isCertified: e.target.checked })}
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleUpdateDietitian}>Save Changes</Button>
        </Modal.Footer>
      </Modal>

      {/* Assign Members Modal */}
      <Modal show={showAssignModal} onHide={() => { setShowAssignModal(false); setCurrentDietitian(null); setSelectedMemberIds([]); }} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Assign Members to {currentDietitian?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {members.map((member) => (
              <Form.Check
                key={member._id}
                type="checkbox"
                label={`${member.name} (${member.email})`}
                checked={selectedMemberIds.includes(member._id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedMemberIds([...selectedMemberIds, member._id]);
                  } else {
                    setSelectedMemberIds(selectedMemberIds.filter(id => id !== member._id));
                  }
                }}
              />
            ))}
            {members.length === 0 && <p>No members available</p>}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAssignModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAssignMembers}>Assign Selected</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DietitiansList;
