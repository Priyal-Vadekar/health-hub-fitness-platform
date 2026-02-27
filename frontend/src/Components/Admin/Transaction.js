import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Modal, Button, Dropdown, DropdownButton, Form, Collapse } from "react-bootstrap";
import Sidebar from "./Sidebar";
import { Header } from "./Header";
import "./css/Staff.css";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PaymentsList = () => {
    const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

    const getAuthToken = () => {
        const raw = localStorage.getItem("auth");
        return raw ? JSON.parse(raw) : null;
    };

    const [payments, setPayments] = useState([]);
    const [filteredPayments, setFilteredPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [filterOpen, setFilterOpen] = useState(false);
    const [paymentFilter, setPaymentFilter] = useState("");
    const componentPDF = useRef();
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePaymentId, setDeletePaymentId] = useState(null);

    useEffect(() => {
        fetchPayments();
    }, []);

    useEffect(() => {
        const filtered = payments.filter((payment) => {
            const status = payment?.status || "";
            return status.toLowerCase().includes(paymentFilter.toLowerCase());
        });
        setFilteredPayments(filtered);
    }, [paymentFilter, payments]);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const token = getAuthToken();
            const response = await axios.get(`${API_BASE}/transactions/all-payments`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            if (response.data.success) {
                setPayments(response.data.data || []);
            } else {
                toast.error("Failed to fetch payments.");
            }
        } catch (error) {
            console.error("Error fetching payments:", error);
            toast.error("Unable to load payments");
        } finally {
            setLoading(false);
        }
    };

    const handleView = (payment) => {
        setSelectedPayment(payment);
        setShowViewModal(true);
    };

    const handleEdit = (payment) => {
        setSelectedPayment({ ...payment });
        setShowEditModal(true);
    };

    const handleDelete = (paymentId) => {
        setDeletePaymentId(paymentId);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!deletePaymentId) return toast.error("No payment selected for deletion");
        try {
            const token = getAuthToken();
            if (!token) return toast.error("Authentication required");

            const response = await axios.delete(`${API_BASE}/transactions/delete-payment/${deletePaymentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.status === 200 || response.data?.message) {
                setPayments((prev) => prev.filter((p) => p._id !== deletePaymentId));
                setShowDeleteModal(false);
                setDeletePaymentId(null);
                toast.success("Payment deleted successfully");
            } else {
                toast.error("Failed to delete payment");
            }
        } catch (error) {
            console.error("Error deleting payment:", error);
            toast.error(error.response?.data?.message || "Failed to delete payment");
        }
    };

    const handleSavePayment = async () => {
        if (!selectedPayment || !selectedPayment.status) return toast.error("Status is required");
        try {
            const token = getAuthToken();
            if (!token) return toast.error("Authentication required");

            const payload = {
                status: selectedPayment.status,
                paymentMethod: selectedPayment.paymentMethod || selectedPayment.paymentMethod,
            };

            const response = await axios.put(
                `${API_BASE}/transactions/update-payment/${selectedPayment._id}`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success || response.data.payment) {
                const updatedPayment = response.data.payment || response.data.data || { ...selectedPayment, ...payload };
                setPayments((prev) => prev.map((p) => (p._id === updatedPayment._id ? updatedPayment : p)));
                toast.success(response.data?.message || "Payment updated successfully");
                setShowEditModal(false);
                setSelectedPayment(null);
            } else {
                toast.error(response.data?.message || "Failed to update payment");
            }
        } catch (error) {
            console.error("Error updating payment:", error);
            toast.error(error.response?.data?.message || "Failed to update payment");
        }
    };

    const generatePDF = () => {
        const input = componentPDF.current;
        if (!input) return;
        html2canvas(input, { scale: 2 }).then((canvas) => {
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            pdf.addImage(imgData, "PNG", 0, 10, imgWidth, imgHeight);
            pdf.save("Payments.pdf");
        });
    };

    const totalPages = Math.max(1, Math.ceil(filteredPayments.length / rowsPerPage));

    return (
        <div className="d-flex">
            <Sidebar />
            <div className="flex-grow-1">
                <Header />
                <div className="container-xxl py-5">
                    <h1>Payments Details</h1>
                    <div className="container Payments-section border-4 border-blue-500 rounded-lg shadow-lg p-4">
                        {loading ? (
                            <p>Loading Payments...</p>
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
                                </div>

                                <Collapse in={filterOpen}>
                                    <div id="filter-collapse" className="card p-3 mb-3 shadow-sm position-relative">
                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            onClick={() => setPaymentFilter("")}
                                            className="position-absolute top-0 end-0 m-2"
                                        >
                                            Clear
                                        </Button>
                                        <Form className="row g-3 align-items-end">
                                            <Form.Group className="col-md-4">
                                                <Form.Label className="fw-semibold">Payment Status</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    placeholder="Enter payment status"
                                                    value={paymentFilter}
                                                    onChange={(e) => setPaymentFilter(e.target.value)}
                                                    className="form-control border border-secondary"
                                                />
                                            </Form.Group>
                                        </Form>
                                    </div>
                                </Collapse>

                                <div ref={componentPDF} className="table-responsive">
                                    <table className="table table-dark table-striped table-bordered text-center">
                                        <thead>
                                            <tr>
                                                <th>No</th>
                                                <th>Payment ID</th>
                                                <th>Amount</th>
                                                <th>Status</th>
                                                <th>Payment Method</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredPayments.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((payment, index) => (
                                                <tr key={payment._id}>
                                                    <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                                                    <td>{payment._id}</td>
                                                    <td>{payment.amount}</td>
                                                    <td>{payment.status}</td>
                                                    <td>{payment.paymentMethod}</td>
                                                    <td>
                                                        <DropdownButton variant="secondary" title="Action">
                                                            <Dropdown.Item onClick={() => handleView(payment)}>View</Dropdown.Item>
                                                            <Dropdown.Item onClick={() => handleEdit(payment)}>Edit</Dropdown.Item>
                                                            <Dropdown.Item onClick={() => handleDelete(payment._id)}>Delete</Dropdown.Item>
                                                        </DropdownButton>
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredPayments.length === 0 && (
                                                <tr>
                                                    <td colSpan="6">No payments found for this filter.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>

                                    <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap">
                                        <Form.Select
                                            value={rowsPerPage}
                                            onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                            className="form-control border border-secondary"
                                            style={{ height: "45px", width: "150px" }}
                                        >
                                            {[2,5,10,15,20].map((n) => <option key={n} value={n}>Show {n} rows</option>)}
                                        </Form.Select>

                                        <div>
                                            <Button variant="secondary" onClick={() => setCurrentPage(prev => Math.max(prev-1,1))} disabled={currentPage===1} className="me-2">Previous</Button>
                                            <span>Page {currentPage} of {totalPages}</span>
                                            <Button variant="secondary" onClick={() => setCurrentPage(prev => Math.min(prev+1,totalPages))} disabled={currentPage===totalPages} className="ms-2">Next</Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* View Modal */}
            <Modal show={showViewModal} onHide={() => setShowViewModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Payment Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedPayment && (
                        <div>
                            <p><strong>Payment ID:</strong> {selectedPayment._id}</p>
                            <p><strong>Member:</strong> {selectedPayment.userMembership?.user?.name || "N/A"}</p>
                            <p><strong>Amount:</strong> ₹ {selectedPayment.amount}</p>
                            <p><strong>Status:</strong> {selectedPayment.status}</p>
                            <p><strong>Method:</strong> {selectedPayment.paymentMethod || "N/A"}</p>
                            <p><strong>Date:</strong> {selectedPayment.paymentDate ? new Date(selectedPayment.paymentDate).toLocaleDateString() : "N/A"}</p>
                        </div>
                    )}
                </Modal.Body>
            </Modal>

            {/* Edit Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Payment</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedPayment && (
                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Label>Status</Form.Label>
                                <Form.Select value={selectedPayment.status} onChange={(e)=>setSelectedPayment({...selectedPayment,status:e.target.value})}>
                                    {["Pending","Completed","Failed","Refunded","Canceled"].map(s => <option key={s} value={s}>{s}</option>)}
                                </Form.Select>
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>Payment Method</Form.Label>
                                <Form.Control type="text" value={selectedPayment.paymentMethod || ""} onChange={(e)=>setSelectedPayment({...selectedPayment,paymentMethod:e.target.value})} placeholder="e.g., Stripe, Razorpay"/>
                            </Form.Group>
                        </Form>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={()=>setShowEditModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleSavePayment}>Save Changes</Button>
                </Modal.Footer>
            </Modal>

            {/* Delete Modal */}
            <Modal show={showDeleteModal} onHide={()=>setShowDeleteModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Delete Payment</Modal.Title>
                </Modal.Header>
                <Modal.Body>Are you sure you want to delete this payment?</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={()=>setShowDeleteModal(false)}>Cancel</Button>
                    <Button variant="danger" onClick={confirmDelete}>Delete</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default PaymentsList;
