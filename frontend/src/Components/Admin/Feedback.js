// frontend/src/Components/Admin/Feedback.js
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Button, Form, Modal } from "react-bootstrap";
import Sidebar from "./Sidebar";
import { Header } from "./Header";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import "./css/Staff.css";

const FeedbackList = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState(null);
  const [currentDeleteFeedback, setCurrentDeleteFeedback] = useState(null);
  const componentPDF = useRef();

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/testimonials/all-testimonials"
      );
      if (response.data) {
        setFeedbacks(response.data);
      }
    } catch (error) {
      console.error("Error fetching testimonials:", error);
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
      pdf.save("Feedbacks.pdf");
    });
  };

  const openEditModal = (feedback) => {
    setCurrentFeedback(feedback);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setCurrentFeedback(null);
  };

  const updateStatus = async () => {
    if (currentFeedback) {
      try {
        await axios.put(
          `http://localhost:5000/api/testimonials/${currentFeedback._id}/status`,
          { status: currentFeedback.active }
        );
        fetchFeedbacks();
        closeEditModal();
      } catch (error) {
        console.error("Error updating status:", error);
      }
    }
  };

  const deleteFeedback = async () => {
    if (currentDeleteFeedback) {
      try {
        await axios.delete(
          `http://localhost:5000/api/testimonials/delete-testimonial/${currentDeleteFeedback._id}`
        );
        fetchFeedbacks();
        setShowDeleteModal(false);
      } catch (error) {
        console.error("Error deleting testimonial:", error);
      }
    }
  };

  const totalPages = Math.max(1, Math.ceil(feedbacks.length / rowsPerPage));
  const paginated = feedbacks.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1">
        <Header />
        <div className="container-xxl py-5">
          <h1>Feedback Details</h1>
          <div className="container Users-section border-4 rounded shadow p-4">
            {loading ? (
              <p>Loading feedbacks...</p>
            ) : (
              <>
                <div className="d-flex justify-content-end mb-3">
                  <Button className="pdf-btn" onClick={generatePDF}>
                    Generate PDF
                  </Button>
                </div>

                <div ref={componentPDF} className="table-responsive">
                  <table className="table table-dark table-striped table-bordered text-center">
                    <thead>
                      <tr>
                        <th>No</th>
                        <th>Name</th>
                        <th>Message</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center">No feedbacks found</td>
                        </tr>
                      ) : (
                        paginated.map((fb, index) => (
                          <tr key={fb._id}>
                            <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                            {/* ── BUG FIX: fb.user can be null if user was deleted
                                Original: fb.user.name → crashes with TypeError
                                Fixed: fb.user?.name with fallback               */}
                            <td>{fb.user?.name || "Deleted User"}</td>
                            <td>{fb.message}</td>
                            <td>{new Date(fb.date).toLocaleDateString()}</td>
                            <td>
                              <span className={`badge ${fb.active ? "bg-success" : "bg-secondary"}`}>
                                {fb.active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex gap-2 justify-content-center">
                                <Button
                                  variant="outline-warning"
                                  size="sm"
                                  onClick={() => openEditModal(fb)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => {
                                    setCurrentDeleteFeedback(fb);
                                    setShowDeleteModal(true);
                                  }}
                                >
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap">
                    <Form.Select
                      value={rowsPerPage}
                      onChange={(e) => {
                        setRowsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="form-control border border-secondary w-auto"
                      style={{ height: "45px" }}
                    >
                      {[5, 10, 15, 20].map((n) => (
                        <option key={n} value={n}>Show {n} rows</option>
                      ))}
                    </Form.Select>
                    <div>
                      <Button
                        variant="secondary"
                        onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                        disabled={currentPage === 1}
                        className="me-2"
                      >
                        Previous
                      </Button>
                      <span>Page {currentPage} of {totalPages}</span>
                      <Button
                        variant="secondary"
                        onClick={() => setCurrentPage((p) => p < totalPages ? p + 1 : p)}
                        disabled={currentPage === totalPages}
                        className="ms-2"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Edit Status Modal */}
      <Modal show={showEditModal} onHide={closeEditModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Feedback Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentFeedback && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  value={currentFeedback.user?.name || "Deleted User"}
                  disabled
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Message</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={currentFeedback.message}
                  disabled
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Date</Form.Label>
                <Form.Control
                  type="text"
                  value={new Date(currentFeedback.date).toLocaleDateString()}
                  disabled
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Check
                  type="switch"
                  label="Active (shown on homepage)"
                  checked={currentFeedback.active}
                  onChange={(e) =>
                    setCurrentFeedback({ ...currentFeedback, active: e.target.checked })
                  }
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeEditModal}>Cancel</Button>
          <Button variant="primary" onClick={updateStatus}>Save Changes</Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* ── BUG FIX: same optional chaining here for the delete confirmation */}
          <p>
            Are you sure you want to delete the feedback from{" "}
            <strong>{currentDeleteFeedback?.user?.name || "this user"}</strong>?
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={deleteFeedback}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default FeedbackList;