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
  const initialTrainerState = {
    userId: "",
    specialty: "",
    description: "",
    image: null,
  };
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

  useEffect(() => {
    const fetchData = async () => {
      await fetchTrainers();
      await fetchUsers();
      await fetchMembers();
    };
    fetchData();
  }, []);

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("auth");
      const rawToken = localStorage.getItem("auth");
      const authToken = rawToken ? JSON.parse(rawToken) : token;
      const res = await axios.get("http://localhost:5000/api/users", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.data.success) {
        const memberList = res.data.data.filter(user => user.role === "Member");
        setMembers(memberList);
      }
    } catch (err) {
      console.error("Error fetching members:", err);
    }
  };

  useEffect(() => {
    const filtered = trainers.filter((trainer) => {
      const specialtyMatch = trainer.specialty
        ?.toLowerCase()
        .includes(specialtyFilter.toLowerCase());
      const nameMatch = trainer.user?.name
        ?.toLowerCase()
        .includes(nameFilter.toLowerCase());
      return specialtyMatch && nameMatch;
    });
    setFilteredTrainers(filtered);
  }, [specialtyFilter, nameFilter, trainers]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        const trainerUsers = res.data.data.filter(user => user.role === "Trainer");
        setUsers(trainerUsers);
      } else console.error("Failed to fetch users.");
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const fetchTrainers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/staff", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const filtered = response.data.data.filter((staff) => staff.role === "Trainer");
      setTrainers(filtered);
    } catch (error) {
      console.error("Error fetching trainers:", error);
    } finally {
      setLoading(false);
    }
  };

  const isUserTrainer = (userId) => {
    return trainers.some(trainer => trainer.user && trainer.user._id === userId);
  };

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
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5000/api/staff/new-staff", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowAdd(false);
      setNewTrainer(initialTrainerState);
      fetchTrainers();
      toast.success("Trainer added successfully!");
    } catch (error) {
      console.error("Error adding trainer:", error);
      toast.error("Failed to add trainer.");
    }
  };

  const deleteTrainer = (id) => {
    setDeleteTrainerId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/staff/delete-staff/${deleteTrainerId}`);
      setTrainers((prev) => prev.filter((trainer) => trainer._id !== deleteTrainerId));
      setShowDeleteModal(false);
      toast.success("Trainer deleted successfully!");
    } catch (error) {
      console.error("Error deleting trainer:", error);
      toast.error("Failed to delete trainer.");
    }
  };

  const handleEdit = (trainer) => {
    setCurrentTrainer(trainer);
    setShowEdit(true);
  };

  const handleSaveEdit = async () => {
    try {
      const token = localStorage.getItem("auth");
      const updated = {
        specialty: currentTrainer.specialty,
        description: currentTrainer.description,
      };
      await axios.patch(
        `http://localhost:5000/api/staff/update-staff/${currentTrainer._id}`,
        updated,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTrainers((prev) =>
        prev.map((t) => (t._id === currentTrainer._id ? currentTrainer : t))
      );
      toast.success("Trainer updated successfully!");
      setShowEdit(false);
    } catch (error) {
      console.error("Error updating trainer:", error);
      toast.error("Failed to update trainer.");
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
      pdf.save("trainers.pdf");
    });
  };

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1">
        <Header />
        <div className="container-xxl py-5">
          <h1>Trainer Details</h1>
          <div className="container trainers-section border-4 border-blue-500 rounded-lg shadow-lg p-4">
            {loading ? (
              <p className="loading-text">Loading trainers...</p>
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
                    + Add Trainer
                  </Button>
                </div>

                <Collapse in={filterOpen}>
                  <div id="filter-collapse" className="card p-3 mb-3 shadow-sm position-relative">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => {
                        setSpecialtyFilter("");
                        setNameFilter("");
                      }}
                      className="position-absolute top-0 end-0 m-2"
                    >
                      Clear
                    </Button>

                    <Form className="row g-3 align-items-end">
                      <Form.Group className="col-md-4">
                        <Form.Label className="fw-semibold">Specialty</Form.Label>
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
                        <th>Specialty</th>
                        <th>Description</th>
                        <th>Action</th>
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
                                <Dropdown.Item
                                  onClick={() => {
                                    setCurrentTrainer(trainer);
                                    setShowDetails(true);
                                  }}
                                >
                                  Details
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => handleEdit(trainer)}>Edit</Dropdown.Item>
                                <Dropdown.Item
                                  onClick={() => {
                                    setCurrentTrainer(trainer);
                                    setShowAssignModal(true);
                                    const assignedIds = members
                                      .filter((m) => m.assignedTrainer === trainer.user?._id)
                                      .map((m) => m._id);
                                    setSelectedMemberIds(assignedIds);
                                  }}
                                >
                                  Assign Members
                                </Dropdown.Item>
                                <Dropdown.Item
                                  onClick={() => deleteTrainer(trainer._id)}
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
                          setCurrentPage(1);
                        }}
                      >
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
                        Page {currentPage} of {Math.ceil(filteredTrainers.length / rowsPerPage)}
                      </span>
                      <Button
                        variant="secondary"
                        onClick={() =>
                          setCurrentPage((prev) =>
                            prev < Math.ceil(filteredTrainers.length / rowsPerPage) ? prev + 1 : prev
                          )
                        }
                        disabled={currentPage === Math.ceil(filteredTrainers.length / rowsPerPage)}
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

      {/* ===== Modals Section ===== */}
      {/* Add Trainer Modal */}
      <Modal show={showAdd} onHide={() => { setShowAdd(false); setNewTrainer(initialTrainerState); }} centered className="custom-scroll">
        <Modal.Header closeButton>
          <Modal.Title>Add Trainer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form encType="multipart/form-data">
            <Form.Group controlId="formSelectUser" className="mb-3">
              <Form.Label>Select User (Trainer)</Form.Label>
              <Form.Control
                as="select"
                value={newTrainer.userId}
                onChange={(e) => setNewTrainer({ ...newTrainer, userId: e.target.value })}
                required
              >
                <option value="">-- Select User --</option>
                {users.map((user) => {
                  const alreadyTrainer = isUserTrainer(user._id);
                  return (
                    <option key={user._id} value={user._id} disabled={alreadyTrainer}>
                      {user.name} ({user.role}){alreadyTrainer ? " - Already Added" : ""}
                    </option>
                  );
                })}
              </Form.Control>
              <Form.Text className="text-muted">
                Only users with the Trainer role who are not already trainers can be selected.
              </Form.Text>
            </Form.Group>

            <Form.Group controlId="formSpecialty">
              <Form.Label>Specialty</Form.Label>
              <Form.Control
                type="text"
                value={newTrainer.specialty}
                onChange={(e) => setNewTrainer({ ...newTrainer, specialty: e.target.value })}
                placeholder="Specialty"
              />
            </Form.Group>

            <Form.Group controlId="formDescription">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                value={newTrainer.description}
                onChange={(e) => setNewTrainer({ ...newTrainer, description: e.target.value })}
                rows={3}
                placeholder="Description"
                style={{ resize: "none", overflowY: "auto", maxHeight: "200px" }}
              />
            </Form.Group>

            <Form.Group controlId="formImage">
              <Form.Label>Trainer Image</Form.Label>
              <Form.Control
                type="file"
                onChange={(e) => setNewTrainer({ ...newTrainer, image: e.target.files[0] })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleAddTrainer}>
            Add Trainer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Details Modal */}
      <Modal show={showDetails} onHide={() => setShowDetails(false)} centered className="custom-scroll">
        <Modal.Header closeButton>
          <Modal.Title>Trainer Details</Modal.Title>
        </Modal.Header>
        <Modal.Body ref={componentPDF}>
          <div className="trainer-details">
            <div className="trainer-image d-flex justify-content-center">
              {currentTrainer?.image && (
                <img
                  src={`/Images/${currentTrainer?.image}`}
                  alt={`${currentTrainer?.user?.name}`}
                  className="img-fluid"
                  style={{ width: "220px", height: "220px", objectFit: "cover", borderRadius: "50%" }}
                />
              )}
            </div>
            <br />
            <p><strong>Name:</strong> {currentTrainer?.user?.name}</p>
            <p><strong>Email:</strong> {currentTrainer?.user?.email}</p>
            <p><strong>Specialty:</strong> {currentTrainer?.specialty}</p>
            <p><strong>Description:</strong> {currentTrainer?.description}</p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button className="pdf-btn mt-3" onClick={generatePDF}>
            Generate PDF
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEdit} onHide={() => setShowEdit(false)} centered className="custom-scroll">
        <Modal.Header closeButton>
          <Modal.Title>Edit Trainer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formTrainerName">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={currentTrainer?.user?.name || ""}
                onChange={(e) =>
                  setCurrentTrainer({ ...currentTrainer, user: { ...currentTrainer.user, name: e.target.value } })
                }
                disabled
              />
            </Form.Group>
            <Form.Group controlId="formTrainerSpecialty">
              <Form.Label>Specialty</Form.Label>
              <Form.Control
                type="text"
                value={currentTrainer?.specialty || ""}
                onChange={(e) => setCurrentTrainer({ ...currentTrainer, specialty: e.target.value })}
              />
            </Form.Group>
            <Form.Group controlId="formTrainerDescription">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                value={currentTrainer?.description || ""}
                onChange={(e) => setCurrentTrainer({ ...currentTrainer, description: e.target.value })}
                rows={3}
                style={{ resize: "none", overflowY: "auto", maxHeight: "200px" }}
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
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered className="custom-scroll">
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this trainer?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Assign Members Modal */}
      <Modal
        show={showAssignModal}
        onHide={() => { setShowAssignModal(false); setCurrentTrainer(null); setSelectedMemberIds([]); }}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Assign Members to {currentTrainer?.user?.name || "Trainer"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {members.length === 0 ? (
              <p>No members available</p>
            ) : (
              members.map((member) => (
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
              ))
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowAssignModal(false); setCurrentTrainer(null); setSelectedMemberIds([]); }}>
            Cancel
          </Button>
          <Button variant="primary" onClick={async () => {
            if (!currentTrainer?.user?._id || selectedMemberIds.length === 0) {
              toast.error("Please select at least one member");
              return;
            }

            try {
              const token = localStorage.getItem("token") || localStorage.getItem("auth");
              const rawToken = localStorage.getItem("auth");
              const authToken = rawToken ? JSON.parse(rawToken) : token;
              const res = await axios.patch(
                `http://localhost:5000/api/admin/trainers/${currentTrainer.user._id}/assign-members`,
                { memberIds: selectedMemberIds },
                { headers: { Authorization: `Bearer ${authToken}` } }
              );

              if (res.data.success) {
                toast.success(`Assigned ${res.data.data.modifiedCount} members successfully!`);
                setShowAssignModal(false);
                setSelectedMemberIds([]);
                setCurrentTrainer(null);
                fetchMembers();
              }
            } catch (error) {
              console.error("Error assigning members:", error);
              toast.error(error.response?.data?.message || "Failed to assign members");
            }
          }}>
            Assign Selected
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TrainerList;
