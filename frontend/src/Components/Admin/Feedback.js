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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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
      if (response.data) setFeedbacks(response.data);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    html2canvas(componentPDF.current, { scale: 2 }).then((canvas) => {
      const pdf = new jsPDF("p", "mm", "a4");
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 10, 210, (canvas.height * 210) / canvas.width);
      pdf.save("Feedbacks.pdf");
    });
  };

  const deleteFeedback = async () => {
    if (!currentDeleteFeedback) return;
    try {
      await axios.delete(
        `http://localhost:5000/api/testimonials/delete-testimonial/${currentDeleteFeedback._id}`
      );
      fetchFeedbacks();
      setShowDeleteModal(false);
      setCurrentDeleteFeedback(null);
    } catch (error) {
      console.error("Error deleting testimonial:", error);
    }
  };

  const totalPages = Math.max(1, Math.ceil(feedbacks.length / rowsPerPage));
  const paginated = feedbacks.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

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
                  <Button className="pdf-btn" onClick={generatePDF}>Generate PDF</Button>
                </div>
                <div ref={componentPDF} className="table-responsive">
                  <table className="table table-dark table-striped table-bordered text-center">
                    <thead>
                      <tr>
                        <th>No</th>
                        <th>Name</th>
                        <th>Message</th>
                        <th>Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.length === 0 ? (
                        <tr><td colSpan="5" className="text-center">No feedbacks found</td></tr>
                      ) : (
                        paginated.map((fb, index) => (
                          <tr key={fb._id}>
                            <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                            {/* BUG FIX: fb.user can be null if user deleted — use optional chaining */}
                            <td>{fb.user?.name || "Deleted User"}</td>
                            <td style={{ maxWidth: 300, textAlign: "left" }}>{fb.message}</td>
                            <td>{new Date(fb.date).toLocaleDateString()}</td>
                            <td>
                              {/* Admin should not edit feedback — only delete */}
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
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap">
                    <Form.Select
                      value={rowsPerPage}
                      onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                      className="form-control border border-secondary w-auto"
                      style={{ height: 45 }}
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
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Confirm Deletion</Modal.Title></Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to delete the feedback from{" "}
            <strong>{currentDeleteFeedback?.user?.name || "this user"}</strong>?
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={deleteFeedback}>Delete</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default FeedbackList;