import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Dropdown, DropdownButton, Form } from "react-bootstrap";
import Sidebar from "./Sidebar";
import { Header } from "./Header";
import "./css/Staff.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_URL = "http://localhost:5000/api/announcements";

const Announcement = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Modal state management
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteAnnouncementId, setDeleteAnnouncementId] = useState(null);

  const [formErrors, setFormErrors] = useState({});

  // States for add announcement and edit announcement
  const initialAnnouncementState = {
    title: "",
    date: "",
    description: "",
    recipients: "",
    type: "",
    active: true,
  };
  const [newAnnouncement, setNewAnnouncement] = useState(initialAnnouncementState);
  const [editAnnouncement, setEditAnnouncement] = useState(initialAnnouncementState);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // Handle Hide and show for Details, Edit and Delete
  const handleShowDetails = (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowDetailsModal(true);
  };

  const handleShowEditModal = (announcement) => {
    setEditAnnouncement({
      ...announcement,
      recipients: announcement.recipients.join(", ")
    });
    setShowEditModal(true);
  };

  const handleDeleteAnnouncement = (announcementId) => {
    setDeleteAnnouncementId(announcementId);
    setShowDeleteModal(true);
  };

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth");
      const response = await axios.get(`${API_URL}/all-announcements`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const payload = response.data;
      const list = Array.isArray(payload)
        ? payload
        : payload?.success && Array.isArray(payload.data)
          ? payload.data
          : Array.isArray(payload?.data)
            ? payload.data
            : [];

      if (!Array.isArray(list)) {
        console.error("Invalid announcements response:", payload);
        setAnnouncements([]);
        toast.error("Invalid data format received");
        return;
      }

      setAnnouncements(list);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      toast.error(error.response?.data?.message || "Failed to load announcements");
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle Add Announcement
  const handleAddAnnouncement = async () => {
    const errors = {};

    if (!newAnnouncement.title.trim()) errors.title = "Title is required.";
    if (!newAnnouncement.date) errors.date = "Date is required.";
    if (!newAnnouncement.description.trim()) errors.description = "Description is required.";
    if (!newAnnouncement.recipients.trim()) errors.recipients = "Recipients are required.";
    if (!newAnnouncement.type.trim()) errors.type = "Type is required.";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({}); // Clear errors

    try {
      const token = localStorage.getItem("auth");
      await axios.post(`${API_URL}/new-announcement`, {
        ...newAnnouncement,
        recipients: newAnnouncement.recipients.split(",").map(r => r.trim()),
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      setShowAddModal(false);
      setNewAnnouncement(initialAnnouncementState);
      toast.success("Announcement added successfully!");
      fetchAnnouncements();
    } catch (error) {
      console.error("Error adding announcement:", error);
      toast.error("Failed to add announcement.");
    }
  };

  // Handle Edit Announcement
  const handleEditAnnouncement = async () => {
    const errors = {};

    if (!editAnnouncement.title.trim()) errors.title = "Title is required.";
    if (!editAnnouncement.date) errors.date = "Date is required.";
    if (!editAnnouncement.description.trim()) errors.description = "Description is required.";
    if (!editAnnouncement.recipients.trim()) errors.recipients = "Recipients are required.";
    if (!editAnnouncement.type.trim()) errors.type = "Type is required.";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({}); // Clear errors

    try {
      const token = localStorage.getItem("auth");
      await axios.put(`${API_URL}/update-announcement/${editAnnouncement._id}`, {
        ...editAnnouncement,
        recipients: editAnnouncement.recipients.split(",").map(r => r.trim()),
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      setShowEditModal(false);
      setEditAnnouncement(initialAnnouncementState);
      toast.success("Announcement updated successfully!");
      fetchAnnouncements();
    } catch (error) {
      console.error("Error updating announcement:", error);
      toast.error("Failed to update announcement.");
    }
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem("auth");
      await axios.delete(`${API_URL}/delete-announcement/${deleteAnnouncementId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setShowDeleteModal(false);
      fetchAnnouncements();
      toast.success("Announcement deleted successfully!");
    } catch (error) {
      console.error("Delete failed", error);
      toast.error("Failed to delete announcement. Please try again.");
    }
  };

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1">
        <Header />
        <div className="container-xxl py-5">
          <h1>Announcements</h1>
          <div className="container announcements-section border-4 border-blue-500 rounded-lg shadow-lg p-4">
            {loading ? (
              <p>Loading Announcements...</p>
            ) : (
              <div className="mb-4">
                <div className="d-flex justify-content-end mb-3">
                  <Button variant="success" onClick={() => setShowAddModal(true)}>
                    + Add Announcement
                  </Button>
                </div>

                <div className="table-responsive">
                  <table className="table table-dark table-striped table-bordered text-center">
                    <thead>
                      <tr>
                        <th>No</th>
                        <th>Title</th>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Recipients</th>
                        <th>Active</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(announcements) && announcements.length > 0 ? (
                        announcements
                          .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
                          .map((announcement, index) => (
                          <tr key={announcement._id}>
                            <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                            <td>{announcement.title}</td>
                            <td>{announcement.date && new Date(announcement.date).toLocaleDateString()}</td>
                            <td>{announcement.type}</td>
                            <td>{Array.isArray(announcement.recipients) ? announcement.recipients.join(", ") : announcement.recipients || "N/A"}</td>
                            <td>
                              <span className={`badge ${announcement.active ? "bg-success" : "bg-danger"}`}>
                                {announcement.active ? "Yes" : "No"}
                              </span>
                            </td>
                            <td>
                              <DropdownButton variant="secondary" title="Action">
                                <Dropdown.Item onClick={() => handleShowDetails(announcement)}>Details</Dropdown.Item>
                                <Dropdown.Item onClick={() => handleShowEditModal(announcement)}>Edit</Dropdown.Item>
                                <Dropdown.Item onClick={() => handleDeleteAnnouncement(announcement._id)}>Delete</Dropdown.Item>
                              </DropdownButton>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="text-center">No announcements found</td>
                        </tr>
                      )}
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
                        Page {currentPage} of {Math.max(1, Math.ceil((Array.isArray(announcements) ? announcements.length : 0) / rowsPerPage))}
                      </span>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          const totalPages = Math.ceil((Array.isArray(announcements) ? announcements.length : 0) / rowsPerPage);
                          setCurrentPage((prev) => prev < totalPages ? prev + 1 : prev);
                        }}
                        disabled={currentPage === Math.ceil((Array.isArray(announcements) ? announcements.length : 0) / rowsPerPage)}
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

      {/* Add Announcement Modal */}
      <Modal show={showAddModal} onHide={() => {
        setShowAddModal(false);
        setNewAnnouncement(initialAnnouncementState);
        setFormErrors({});
      }}
        centered className="custom-scroll">
        <Modal.Header closeButton>
          <Modal.Title>Add Announcement</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form method="POST">
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                isInvalid={!!formErrors.title}
              />
              <Form.Control.Feedback type="invalid">{formErrors.title}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                value={newAnnouncement.date}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, date: e.target.value })}
                isInvalid={!!formErrors.date}
              />
              <Form.Control.Feedback type="invalid">{formErrors.date}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newAnnouncement.description}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, description: e.target.value })}
                isInvalid={!!formErrors.description}
              />
              <Form.Control.Feedback type="invalid">{formErrors.description}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Recipients (comma separated)</Form.Label>
              <Form.Control
                type="text"
                value={newAnnouncement.recipients}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, recipients: e.target.value })}
                placeholder="e.g., member, trainer"
                isInvalid={!!formErrors.recipients}
              />
              <Form.Control.Feedback type="invalid">{formErrors.recipients}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Type</Form.Label>
              <Form.Control
                type="text"
                value={newAnnouncement.type}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, type: e.target.value })}
                placeholder="e.g., diet, renewal, class"
                isInvalid={!!formErrors.type}
              />
              <Form.Control.Feedback type="invalid">{formErrors.type}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Active"
                checked={newAnnouncement.active}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, active: e.target.checked })}
              />
            </Form.Group>

            <Button variant="primary" onClick={handleAddAnnouncement}>
              Add Announcement
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} centered className="custom-scroll">
        <Modal.Header closeButton>
          <Modal.Title>Announcement Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAnnouncement && (
            <div>
              <p><strong>Title:</strong> {selectedAnnouncement.title}</p>
              <p><strong>Date:</strong> {selectedAnnouncement.date && new Date(selectedAnnouncement.date).toLocaleDateString()}</p>
              <p><strong>Description:</strong> {selectedAnnouncement.description}</p>
              <p><strong>Recipients:</strong> {Array.isArray(selectedAnnouncement.recipients) ? selectedAnnouncement.recipients.join(", ") : selectedAnnouncement.recipients || "N/A"}</p>
              <p><strong>Type:</strong> {selectedAnnouncement.type}</p>
              <p><strong>Active:</strong> {selectedAnnouncement.active ? "Yes" : "No"}</p>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Edit Announcement Modal */}
      <Modal show={showEditModal} onHide={() => {
        setShowEditModal(false);
        setEditAnnouncement(initialAnnouncementState);
        setFormErrors({});
      }}
        centered className="custom-scroll">
        <Modal.Header closeButton>
          <Modal.Title>Edit Announcement</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form method="POST">
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={editAnnouncement.title}
                onChange={(e) => setEditAnnouncement({ ...editAnnouncement, title: e.target.value })}
                isInvalid={!!formErrors.title}
              />
              <Form.Control.Feedback type="invalid">{formErrors.title}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                value={editAnnouncement.date ? editAnnouncement.date.substring(0, 10) : ""}
                onChange={(e) => setEditAnnouncement({ ...editAnnouncement, date: e.target.value })}
                isInvalid={!!formErrors.date}
              />
              <Form.Control.Feedback type="invalid">{formErrors.date}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={editAnnouncement.description}
                onChange={(e) => setEditAnnouncement({ ...editAnnouncement, description: e.target.value })}
                isInvalid={!!formErrors.description}
              />
              <Form.Control.Feedback type="invalid">{formErrors.description}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Recipients (comma separated)</Form.Label>
              <Form.Control
                type="text"
                value={editAnnouncement.recipients}
                onChange={(e) => setEditAnnouncement({ ...editAnnouncement, recipients: e.target.value })}
                placeholder="e.g., member, trainer"
                isInvalid={!!formErrors.recipients}
              />
              <Form.Control.Feedback type="invalid">{formErrors.recipients}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Type</Form.Label>
              <Form.Control
                type="text"
                value={editAnnouncement.type}
                onChange={(e) => setEditAnnouncement({ ...editAnnouncement, type: e.target.value })}
                placeholder="e.g., diet, renewal, class"
                isInvalid={!!formErrors.type}
              />
              <Form.Control.Feedback type="invalid">{formErrors.type}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Active"
                checked={editAnnouncement.active}
                onChange={(e) => setEditAnnouncement({ ...editAnnouncement, active: e.target.checked })}
              />
            </Form.Group>

            <Button variant="primary" onClick={handleEditAnnouncement}>
              Save Changes
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered className="custom-scroll">
        <Modal.Header>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this announcement?</Modal.Body>
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

export default Announcement;
