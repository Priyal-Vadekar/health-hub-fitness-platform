import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Button, Dropdown, DropdownButton, Form, Modal } from "react-bootstrap";
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
      setLoading(false);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      setLoading(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await axios.put(`http://localhost:5000/api/testimonials/${id}/status`, {
        status: !currentStatus,
      });
      fetchFeedbacks();
    } catch (err) {
      console.error("Status update failed", err);
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

  // Open the edit modal and set the current feedback
  const openEditModal = (feedback) => {
    setCurrentFeedback(feedback);
    setShowEditModal(true);
  };

  // Close the edit modal
  const closeEditModal = () => {
    setShowEditModal(false);
    setCurrentFeedback(null);
  };

  // Handle status update in the modal
  const updateStatus = async () => {
    if (currentFeedback) {
      try {
        await axios.put(
          `http://localhost:5000/api/testimonials/${currentFeedback._id}/status`,
          {
            status: currentFeedback.active,
          }
        );
        fetchFeedbacks();
        closeEditModal();
      } catch (error) {
        console.error("Error updating status:", error);
      }
    }
  };

  // Delete feedback
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
                        {/* <th>Status</th>
                                                <th>Action</th> */}
                      </tr>
                    </thead>
                    <tbody>
                      {feedbacks
                        .slice(
                          (currentPage - 1) * rowsPerPage,
                          currentPage * rowsPerPage
                        )
                        .map((fb, index) => (
                          <tr key={fb._id}>
                            <td>
                              {(currentPage - 1) * rowsPerPage + index + 1}
                            </td>
                            <td>{fb.user.name}</td>
                            <td>{fb.message}</td>
                            <td>{new Date(fb.date).toLocaleDateString()}</td>
                            {/* <td>
                                                            <Form.Check
                                                                type="switch"
                                                                checked={fb.active}
                                                                onChange={() => toggleStatus(fb._id, fb.active)}
                                                            />
                                                        </td>
                                                        <td>
                                                            <DropdownButton variant="secondary" title="Action">
                                                                <Dropdown.Item onClick={() => openEditModal(fb)}>Edit Status</Dropdown.Item>
                                                                <Dropdown.Item onClick={() => { setCurrentDeleteFeedback(fb); setShowDeleteModal(true); }}>Delete</Dropdown.Item>
                                                            </DropdownButton>
                                                        </td> */}
                          </tr>
                        ))}
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
                      {[2, 5, 10, 15, 20].map((n) => (
                        <option key={n} value={n}>
                          Show {n} rows
                        </option>
                      ))}
                    </Form.Select>
                    <div>
                      <Button
                        variant="secondary"
                        onClick={() =>
                          setCurrentPage(Math.max(currentPage - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className="me-2"
                      >
                        Previous
                      </Button>
                      <span>
                        Page {currentPage} of{" "}
                        {Math.ceil(feedbacks.length / rowsPerPage)}
                      </span>
                      <Button
                        variant="secondary"
                        onClick={() =>
                          setCurrentPage((prev) =>
                            prev < Math.ceil(feedbacks.length / rowsPerPage)
                              ? prev + 1
                              : prev
                          )
                        }
                        disabled={
                          currentPage ===
                          Math.ceil(feedbacks.length / rowsPerPage)
                        }
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

      {/* Edit Modal */}
      <Modal
        show={showEditModal}
        onHide={closeEditModal}
        centered
        className="custom-scroll"
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentFeedback && (
            <Form>
              <Form.Group controlId="formFeedbackName">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  value={currentFeedback.user.name}
                  disabled
                />
              </Form.Group>

              <Form.Group controlId="formFeedbackMessage">
                <Form.Label>Message</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={currentFeedback.message}
                  disabled
                />
              </Form.Group>

              <Form.Group controlId="formFeedbackDate">
                <Form.Label>Date</Form.Label>
                <Form.Control
                  type="text"
                  value={new Date(currentFeedback.date).toLocaleDateString()}
                  disabled
                />
              </Form.Group>

              <Form.Group controlId="formFeedbackStatus">
                <Form.Label>Status</Form.Label>
                <Form.Check
                  type="switch"
                  label="Active"
                  checked={currentFeedback.active}
                  onChange={(e) =>
                    setCurrentFeedback({
                      ...currentFeedback,
                      active: e.target.checked,
                    })
                  }
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={updateStatus}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentDeleteFeedback && (
            <p>
              Are you sure you want to delete the testimonial from{" "}
              {currentDeleteFeedback.user.name}?
            </p>
          )}
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
