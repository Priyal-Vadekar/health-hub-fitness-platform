// frontend/src/Components/Admin/Trainer.js
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Modal, Button, Dropdown, DropdownButton, Form, Collapse } from "react-bootstrap";
import Sidebar from "./Sidebar";
import { Header } from "./Header";
import "./css/trainer.css";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const TrainerList = () => {
  const [showAdd, setShowAdd] = useState(false);
  const [users, setUsers] = useState([]);
  const initialTrainerState = { userId: "", specialty: "", description: "", image: null };
  const [newTrainer, setNewTrainer] = useState(initialTrainerState);
  const componentPDF = useRef();
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [currentTrainer, setCurrentTrainer] = useState(null);
  const [deleteTrainerId, setDeleteTrainerId] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [filteredTrainers, setFilteredTrainers] = useState([]);
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const getAuthToken = () => {
    const raw = localStorage.getItem("auth");
    return raw ? JSON.parse(raw) : null;
  };

  useEffect(() => {
    fetchTrainers();
    fetchUsers();
    fetchMembers();
  }, []);

  useEffect(() => {
    const filtered = trainers.filter((trainer) => {
      const specialtyMatch = trainer.specialty?.toLowerCase().includes(specialtyFilter.toLowerCase());
      const nameMatch = trainer.user?.name?.toLowerCase().includes(nameFilter.toLowerCase());
      return specialtyMatch && nameMatch;
    });
    setFilteredTrainers(filtered);
  }, [specialtyFilter, nameFilter, trainers]);

  const fetchMembers = async () => {
    try {
      const token = getAuthToken();
      const res = await axios.get("http://localhost:5000/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setMembers(res.data.data.filter((u) => u.role === "Member"));
      }
    } catch (err) {
      console.error("Error fetching members:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = getAuthToken();
      const res = await axios.get("http://localhost:5000/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setUsers(res.data.data.filter((u) => u.role === "Trainer"));
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const fetchTrainers = async () => {
    try {
      const token = getAuthToken();
      const response = await axios.get("http://localhost:5000/api/staff", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const filtered = (response.data.data || []).filter((s) => s.role === "Trainer");
      setTrainers(filtered);
    } catch (error) {
      console.error("Error fetching trainers:", error);
    } finally {
      setLoading(false);
    }
  };

  const isUserTrainer = (userId) => trainers.some((t) => t.user?._id === userId);

  const handleAddTrainer = async () => {
    if (!newTrainer.userId || !newTrainer.specialty || !newTrainer.image) {
      toast.warn("Please fill all required fields.");
      return;
    }
    const formData = new FormData();
    formData.append("userId", newTrainer.userId);
    formData.append("specialty", newTrainer.specialty);
    formData.append("description", newTrainer.description);
    formData.append("role", "Trainer");
    formData.append("image", newTrainer.image);
    try {
      const token = getAuthToken();
      await axios.post("http://localhost:5000/api/staff/new-staff", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowAdd(false);
      setNewTrainer(initialTrainerState);
      fetchTrainers();
      toast.success("Trainer added successfully!");
    } catch (error) {
      toast.error("Failed to add trainer.");
    }
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/staff/delete-staff/${deleteTrainerId}`);
      setTrainers((prev) => prev.filter((t) => t._id !== deleteTrainerId));
      setShowDeleteModal(false);
      toast.success("Trainer deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete trainer.");
    }
  };

  const handleSaveEdit = async () => {
    try {
      const token = getAuthToken();
      await axios.patch(
        `http://localhost:5000/api/staff/update-staff/${currentTrainer._id}`,
        { specialty: currentTrainer.specialty, description: currentTrainer.description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTrainers((prev) => prev.map((t) => t._id === currentTrainer._id ? currentTrainer : t));
      toast.success("Trainer updated successfully!");
      setShowEdit(false);
    } catch (error) {
      toast.error("Failed to update trainer.");
    }
  };

  const generatePDF = () => {
    html2canvas(componentPDF.current, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      pdf.addImage(imgData, "PNG", 0, 10, 210, (canvas.height * 210) / canvas.width);
      pdf.save("trainers.pdf");
    });
  };

  const openAssignModal = (trainer) => {
    setCurrentTrainer(trainer);
    // ── BUG FIX: Pre-check members already assigned to this trainer
    // Original checked members.assignedTrainer === trainer.user?._id
    // but assignedTrainer stores the user _id (string compare needed)
    const trainerId = trainer.user?._id?.toString();
    const alreadyAssigned = members
      .filter((m) => m.assignedTrainer?.toString() === trainerId)
      .map((m) => m._id);
    setSelectedMemberIds(alreadyAssigned);
    setShowAssignModal(true);
  };

  const handleAssignMembers = async () => {
    if (!currentTrainer?.user?._id) {
      toast.error("Trainer not found");
      return;
    }
    try {
      const token = getAuthToken();
      const res = await axios.patch(
        `http://localhost:5000/api/admin/trainers/${currentTrainer.user._id}/assign-members`,
        { memberIds: selectedMemberIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success(
          selectedMemberIds.length === 0
            ? "All members unassigned successfully"
            : `Assigned ${res.data.data.modifiedCount} members successfully!`
        );
        setShowAssignModal(false);
        setSelectedMemberIds([]);
        setCurrentTrainer(null);
        fetchMembers();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to assign members");
    }
  };

  const totalPages = Math.max(1, Math.ceil(filteredTrainers.length / rowsPerPage));

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1">
        <Header />
        <div className="container-xxl py-5">
          <h1>Trainer Details</h1>
          <div className="container trainers-section border-4 rounded-lg shadow-lg p-4">
            {loading ? (
              <p className="loading-text">Loading trainers...</p>
            ) : (
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <Button variant="dark" onClick={() => setFilterOpen(!filterOpen)}>
                    {filterOpen ? "Hide Filters" : "Show Filters"}
                  </Button>
                  <Button className="pdf-btn mt-3" onClick={generatePDF}>Generate PDF</Button>
                  <Button variant="success" onClick={() => setShowAdd(true)}>+ Add Trainer</Button>
                </div>

                <Collapse in={filterOpen}>
                  <div className="card p-3 mb-3 shadow-sm position-relative">
                    <Button
                      variant="outline-secondary" size="sm"
                      onClick={() => { setSpecialtyFilter(""); setNameFilter(""); }}
                      className="position-absolute top-0 end-0 m-2"
                    >Clear</Button>
                    <Form className="row g-3">
                      <Form.Group className="col-md-4">
                        <Form.Label>Specialty</Form.Label>
                        <Form.Control type="text" value={specialtyFilter} onChange={(e) => setSpecialtyFilter(e.target.value)} />
                      </Form.Group>
                      <Form.Group className="col-md-4">
                        <Form.Label>Name</Form.Label>
                        <Form.Control type="text" value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} />
                      </Form.Group>
                    </Form>
                  </div>
                </Collapse>

                <div ref={componentPDF} className="table-responsive">
                  <table className="table table-dark table-striped table-bordered text-center w-100">
                    <thead>
                      <tr>
                        <th>No</th><th>Name</th><th>Email</th>
                        <th>Specialty</th><th>Description</th><th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTrainers
                        .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
                        .map((trainer, index) => (
                          <tr key={trainer._id}>
                            <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                            <td>{trainer.user?.name || "Trainer"}</td>
                            <td>{trainer.user?.email || "N/A"}</td>
                            <td>{trainer.specialty}</td>
                            <td>{trainer.description}</td>
                            <td>
                              <DropdownButton variant="secondary" title="Action">
                                <Dropdown.Item onClick={() => { setCurrentTrainer(trainer); setShowDetails(true); }}>
                                  Details
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => { setCurrentTrainer(trainer); setShowEdit(true); }}>
                                  Edit
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => openAssignModal(trainer)}>
                                  Assign Members
                                </Dropdown.Item>
                                <Dropdown.Item
                                  className="text-danger"
                                  onClick={() => { setDeleteTrainerId(trainer._id); setShowDeleteModal(true); }}
                                >
                                  Delete
                                </Dropdown.Item>
                              </DropdownButton>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <Form.Select
                      value={rowsPerPage}
                      onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                      className="w-auto"
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

      {/* Add Trainer Modal */}
      <Modal show={showAdd} onHide={() => { setShowAdd(false); setNewTrainer(initialTrainerState); }} centered>
        <Modal.Header closeButton><Modal.Title>Add Trainer</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Select User (Trainer role)</Form.Label>
              <Form.Control as="select" value={newTrainer.userId} onChange={(e) => setNewTrainer({ ...newTrainer, userId: e.target.value })}>
                <option value="">-- Select User --</option>
                {users.map((user) => {
                  const already = isUserTrainer(user._id);
                  return (
                    <option key={user._id} value={user._id} disabled={already}>
                      {user.name}{already ? " - Already Added" : ""}
                    </option>
                  );
                })}
              </Form.Control>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Specialty</Form.Label>
              <Form.Control type="text" value={newTrainer.specialty} onChange={(e) => setNewTrainer({ ...newTrainer, specialty: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control as="textarea" rows={3} value={newTrainer.description} onChange={(e) => setNewTrainer({ ...newTrainer, description: e.target.value })} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Image</Form.Label>
              <Form.Control type="file" onChange={(e) => setNewTrainer({ ...newTrainer, image: e.target.files[0] })} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleAddTrainer}>Add Trainer</Button>
        </Modal.Footer>
      </Modal>

      {/* Details Modal */}
      <Modal show={showDetails} onHide={() => setShowDetails(false)} centered>
        <Modal.Header closeButton><Modal.Title>Trainer Details</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="text-center mb-3">
            {currentTrainer?.image && (
              <img
                src={`/Images/${currentTrainer.image}`}
                alt={currentTrainer.user?.name}
                style={{ width: 180, height: 180, objectFit: "cover", borderRadius: "50%" }}
              />
            )}
          </div>
          <p><strong>Name:</strong> {currentTrainer?.user?.name}</p>
          <p><strong>Email:</strong> {currentTrainer?.user?.email}</p>
          <p><strong>Specialty:</strong> {currentTrainer?.specialty}</p>
          <p><strong>Description:</strong> {currentTrainer?.description}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button className="pdf-btn" onClick={generatePDF}>Generate PDF</Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEdit} onHide={() => setShowEdit(false)} centered>
        <Modal.Header closeButton><Modal.Title>Edit Trainer</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control type="text" value={currentTrainer?.user?.name || ""} disabled />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Specialty</Form.Label>
              <Form.Control type="text" value={currentTrainer?.specialty || ""} onChange={(e) => setCurrentTrainer({ ...currentTrainer, specialty: e.target.value })} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Description</Form.Label>
              <Form.Control as="textarea" rows={3} value={currentTrainer?.description || ""} onChange={(e) => setCurrentTrainer({ ...currentTrainer, description: e.target.value })} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleSaveEdit}>Save Changes</Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Confirm Delete</Modal.Title></Modal.Header>
        <Modal.Body><p>Are you sure you want to delete this trainer?</p></Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>Delete</Button>
        </Modal.Footer>
      </Modal>

      {/* ── Assign Members Modal — FIXED UI ───────────────────────────────── */}
      <Modal
        show={showAssignModal}
        onHide={() => { setShowAssignModal(false); setCurrentTrainer(null); setSelectedMemberIds([]); }}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Assign Members to {currentTrainer?.user?.name || "Trainer"}</Modal.Title>
        </Modal.Header>
        {/* ── FIX: Added maxHeight + overflow-y scroll so modal doesn't overflow screen */}
        <Modal.Body style={{ maxHeight: "60vh", overflowY: "auto" }}>
          {members.length === 0 ? (
            <p className="text-muted">No members available</p>
          ) : (
            <>
              <p className="text-muted mb-3">
                <small>
                  {selectedMemberIds.length} member(s) selected.
                  Pre-checked members are already assigned to this trainer.
                </small>
              </p>
              <div className="row">
                {members.map((member) => (
                  <div className="col-md-6 mb-2" key={member._id}>
                    <Form.Check
                      type="checkbox"
                      id={`member-${member._id}`}
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
          <Button
            variant="secondary"
            onClick={() => { setShowAssignModal(false); setCurrentTrainer(null); setSelectedMemberIds([]); }}
          >
            Cancel
          </Button>
          {/* ── FIX: Allow saving with 0 members selected (to unassign everyone) */}
          <Button variant="primary" onClick={handleAssignMembers}>
            Save Assignment
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TrainerList;