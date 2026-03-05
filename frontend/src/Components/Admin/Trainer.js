// frontend/src/Components/Admin/Trainer.js
import React, { useState, useEffect, useRef } from "react";
import { FiCheck } from "react-icons/fi";
import { Modal, Button, Dropdown, DropdownButton, Form, Collapse } from "react-bootstrap";
import Sidebar from "./Sidebar";
import { Header } from "./Header";
import "./css/trainer.css";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { http } from "../../api/http";

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
  const [memberSearch, setMemberSearch] = useState("");
  const [filteredTrainers, setFilteredTrainers] = useState([]);
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    fetchTrainers();
    fetchUsers();
    fetchMembers();
  }, []);

  useEffect(() => {
    const filtered = trainers.filter((t) => {
      const sMatch = t.specialty?.toLowerCase().includes(specialtyFilter.toLowerCase());
      const nMatch = t.user?.name?.toLowerCase().includes(nameFilter.toLowerCase());
      return sMatch && nMatch;
    });
    setFilteredTrainers(filtered);
  }, [specialtyFilter, nameFilter, trainers]);

  const fetchMembers = async () => {
    try {
      const res = await http.get("/api/users");
      if (res.data.success) setMembers(res.data.data.filter((u) => u.role === "Member"));
    } catch (err) { console.error("Error fetching members:", err); }
  };

  const fetchUsers = async () => {
    try {
      const res = await http.get("/api/users");
      if (res.data.success) setUsers(res.data.data.filter((u) => u.role === "Trainer"));
    } catch (err) { console.error("Error fetching users:", err); }
  };

  const fetchTrainers = async () => {
    try {
      const res = await http.get("/api/staff");
      setTrainers((res.data.data || []).filter((s) => s.role === "Trainer"));
    } catch (error) { console.error("Error fetching trainers:", error); }
    finally { setLoading(false); }
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
      await http.post("/staff/new-staff", formData);
      setShowAdd(false);
      setNewTrainer(initialTrainerState);
      fetchTrainers();
      toast.success("Trainer added!");
    } catch (e) { toast.error("Failed to add trainer."); }
  };

  const confirmDelete = async () => {
    try {
      await http.delete(`/staff/delete-staff/${deleteTrainerId}`);
      setTrainers((prev) => prev.filter((t) => t._id !== deleteTrainerId));
      setShowDeleteModal(false);
      toast.success("Trainer deleted!");
    } catch (e) { toast.error("Failed to delete trainer."); }
  };

  const handleSaveEdit = async () => {
    try {
      await http.patch(
        `/staff/update-staff/${currentTrainer._id}`,
        { specialty: currentTrainer.specialty, description: currentTrainer.description }
      );
      setTrainers((prev) => prev.map((t) => t._id === currentTrainer._id ? currentTrainer : t));
      toast.success("Trainer updated!");
      setShowEdit(false);
    } catch (e) { toast.error("Failed to update trainer."); }
  };

  const generatePDF = () => {
    html2canvas(componentPDF.current, { scale: 2 }).then((canvas) => {
      const pdf = new jsPDF("p", "mm", "a4");
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 10, 210, (canvas.height * 210) / canvas.width);
      pdf.save("trainers.pdf");
    });
  };

  const openAssignModal = (trainer) => {
    setCurrentTrainer(trainer);
    setMemberSearch("");
    const tid = trainer.user?._id?.toString();
    const already = members.filter((m) => m.assignedTrainer?.toString() === tid).map((m) => m._id);
    setSelectedMemberIds(already);
    setShowAssignModal(true);
  };

  const handleAssignMembers = async () => {
    if (!currentTrainer?.user?._id) { toast.error("Trainer not found"); return; }
    try {
      // ── FIX: send auth header — original had no/wrong token → 404 "No token provided"
      const res = await http.patch(
        `/admin/trainers/${currentTrainer.user._id}/assign-members`,
        { memberIds: selectedMemberIds }
      );
      if (res.data.success) {
        toast.success(selectedMemberIds.length === 0 ? "All unassigned" : `${res.data.data.modifiedCount} assigned!`);
        setShowAssignModal(false);
        setSelectedMemberIds([]);
        setCurrentTrainer(null);
        fetchMembers();
        fetchTrainers();
      }
    } catch (e) { toast.error(e.response?.data?.message || "Failed to assign"); }
  };

  const totalPages = Math.max(1, Math.ceil(filteredTrainers.length / rowsPerPage));

  // Members filtered by search in modal
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
                    <Button variant="outline-secondary" size="sm" onClick={() => { setSpecialtyFilter(""); setNameFilter(""); }} className="position-absolute top-0 end-0 m-2">Clear</Button>
                    <Form className="row g-3">
                      <Form.Group className="col-md-4"><Form.Label>Specialty</Form.Label><Form.Control type="text" value={specialtyFilter} onChange={(e) => setSpecialtyFilter(e.target.value)} /></Form.Group>
                      <Form.Group className="col-md-4"><Form.Label>Name</Form.Label><Form.Control type="text" value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} /></Form.Group>
                    </Form>
                  </div>
                </Collapse>

                <div ref={componentPDF} className="table-responsive">
                  <table className="table table-dark table-striped table-bordered text-center w-100">
                    <thead>
                      <tr><th>No</th><th>Name</th><th>Email</th><th>Specialty</th><th>Description</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {filteredTrainers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((trainer, index) => (
                        <tr key={trainer._id}>
                          <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                          <td>{trainer.user?.name || "Trainer"}</td>
                          <td>{trainer.user?.email || "N/A"}</td>
                          <td>{trainer.specialty}</td>
                          <td>{trainer.description}</td>
                          <td>
                            <DropdownButton variant="secondary" title="Action">
                              <Dropdown.Item onClick={() => { setCurrentTrainer(trainer); setShowDetails(true); }}>Details</Dropdown.Item>
                              <Dropdown.Item onClick={() => { setCurrentTrainer(trainer); setShowEdit(true); }}>Edit</Dropdown.Item>
                              <Dropdown.Item onClick={() => openAssignModal(trainer)}>Assign Members</Dropdown.Item>
                              <Dropdown.Item className="text-danger" onClick={() => { setDeleteTrainerId(trainer._id); setShowDeleteModal(true); }}>Delete</Dropdown.Item>
                            </DropdownButton>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <Form.Select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="w-auto">
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
                {users.map((u) => { const already = isUserTrainer(u._id); return <option key={u._id} value={u._id} disabled={already}>{u.name}{already ? " - Already Added" : ""}</option>; })}
              </Form.Control>
            </Form.Group>
            <Form.Group className="mb-3"><Form.Label>Specialty</Form.Label><Form.Control type="text" value={newTrainer.specialty} onChange={(e) => setNewTrainer({ ...newTrainer, specialty: e.target.value })} /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Description</Form.Label><Form.Control as="textarea" rows={3} value={newTrainer.description} onChange={(e) => setNewTrainer({ ...newTrainer, description: e.target.value })} /></Form.Group>
            <Form.Group><Form.Label>Image</Form.Label><Form.Control type="file" onChange={(e) => setNewTrainer({ ...newTrainer, image: e.target.files[0] })} /></Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer><Button variant="primary" onClick={handleAddTrainer}>Add Trainer</Button></Modal.Footer>
      </Modal>

      {/* Details Modal */}
      <Modal show={showDetails} onHide={() => setShowDetails(false)} centered>
        <Modal.Header closeButton><Modal.Title>Trainer Details</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="text-center mb-3">
            {currentTrainer?.image && <img src={`/Images/${currentTrainer.image}`} alt="" style={{ width: 180, height: 180, objectFit: "cover", borderRadius: "50%" }} />}
          </div>
          <p><strong>Name:</strong> {currentTrainer?.user?.name}</p>
          <p><strong>Email:</strong> {currentTrainer?.user?.email}</p>
          <p><strong>Specialty:</strong> {currentTrainer?.specialty}</p>
          <p><strong>Description:</strong> {currentTrainer?.description}</p>
        </Modal.Body>
        <Modal.Footer><Button className="pdf-btn" onClick={generatePDF}>Generate PDF</Button></Modal.Footer>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEdit} onHide={() => setShowEdit(false)} centered>
        <Modal.Header closeButton><Modal.Title>Edit Trainer</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3"><Form.Label>Name</Form.Label><Form.Control type="text" value={currentTrainer?.user?.name || ""} disabled /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Specialty</Form.Label><Form.Control type="text" value={currentTrainer?.specialty || ""} onChange={(e) => setCurrentTrainer({ ...currentTrainer, specialty: e.target.value })} /></Form.Group>
            <Form.Group><Form.Label>Description</Form.Label><Form.Control as="textarea" rows={3} value={currentTrainer?.description || ""} onChange={(e) => setCurrentTrainer({ ...currentTrainer, description: e.target.value })} /></Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer><Button variant="primary" onClick={handleSaveEdit}>Save Changes</Button></Modal.Footer>
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

      {/* ── Assign Members Modal — FIXED: proper grid, search, token ─────── */}
      <Modal
        show={showAssignModal}
        onHide={() => { setShowAssignModal(false); setCurrentTrainer(null); setSelectedMemberIds([]); setMemberSearch(""); }}
        centered size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Assign Members — {currentTrainer?.user?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: "16px 24px" }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="text-muted" style={{ fontSize: 13 }}>
              {selectedMemberIds.length} of {members.length} selected
            </span>
            <Button variant="outline-secondary" size="sm" onClick={() => setSelectedMemberIds([])}>Clear All</Button>
          </div>

          <Form.Control
            type="text"
            placeholder="Search members by name or email..."
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            className="mb-3"
          />

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
                          cursor: "pointer", transition: "all 0.15s",
                        }}
                        onClick={() => {
                          if (checked) setSelectedMemberIds((prev) => prev.filter((id) => id !== member._id));
                          else setSelectedMemberIds((prev) => [...prev, member._id]);
                        }}
                      >
                        <div style={{
                          width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                          background: checked ? "#28a745" : "transparent",
                          border: `2px solid ${checked ? "#28a745" : "#888"}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {checked && <FiCheck size={11} style={{ color: "#fff" }} />}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: "#fff", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{member.name}</div>
                          <div style={{ color: "#aaa", fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{member.email}</div>
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
          <Button variant="secondary" onClick={() => { setShowAssignModal(false); setCurrentTrainer(null); setSelectedMemberIds([]); setMemberSearch(""); }}>Cancel</Button>
          <Button variant="primary" onClick={handleAssignMembers}>
            Save Assignment ({selectedMemberIds.length} selected)
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TrainerList;