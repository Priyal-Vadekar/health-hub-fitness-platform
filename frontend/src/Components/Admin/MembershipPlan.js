import React, { useState, useEffect } from "react";
import { Modal, Button, Dropdown, DropdownButton, Form } from "react-bootstrap";
import Sidebar from "./Sidebar";
import { Header } from "./Header";
import "./css/Staff.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { http } from "../../api/http";

const MembershipPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5); // Default rows per page
  // Modal state management
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [formErrors, setFormErrors] = useState({});

  // States for add plan and edit plan
  const initialPlanState = {
    plan: "", // Default plan
    title: "",
    description: "",
    duration: 1, // Default duration
    price: "",
    personalTrainerAvailable: false,
    personalTrainerCharge: "",
    discount: "",
    benefits: [],
  };
  const [newPlan, setNewPlan] = useState(initialPlanState);
  const [editPlan, setEditPlan] = useState(initialPlanState);
  const [deletePlanId, setDeletePlanId] = useState(null);

  const planMapping = {
    "1-month": { title: "1 Month Membership", duration: 1 },
    "3-month": { title: "3 Month Membership", duration: 3 },
    "6-month": { title: "6 Month Membership", duration: 6 },
    "1-year": { title: "1 Year Membership", duration: 12 },
    "2-year": { title: "2 Year Membership", duration: 24 },
    "3-year": { title: "3 Year Membership", duration: 36 },
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // Handle Hide and show for Details, Edit and Delete
  const handleShowDetails = (plan) => {
    setSelectedPlan(plan);
    setShowDetailsModal(true);
  };

  const handleShowEditModal = (plan) => {
    setEditPlan(plan);
    setShowEditModal(true);
  };

  const handleDeletePlan = (planId) => {
    setDeletePlanId(planId);
    setShowDeleteModal(true);
  };
  const fetchPlans = async () => {
    try {
      const response = await http.get("/membership-plans");
      setPlans(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching membership plans:", error);
      setLoading(false);
    }
  };

  const planOptions = [
    "1-month",
    "3-month",
    "6-month",
    "1-year",
    "2-year",
    "3-year",
  ];
  // eslint-disable-next-line
  const durationOptions = [1, 3, 6, 12, 24, 36];

  // Handle Add Plan
  const handleAddPlan = async () => {
    const errors = {};

    if (!newPlan.plan.trim()) errors.plan = "Plan is required.";
    if (!newPlan.title.trim()) errors.title = "Title is required.";
    if (!newPlan.description.trim())
      errors.description = "Description is required.";
    // Basic price validation
    if (!newPlan.price || isNaN(newPlan.price) || Number(newPlan.price) <= 0) {
      errors.price = "Price must be a valid positive number.";
    }

    // Conditional price rule: if plan is not '1-month' and '3-month', price must be > ₹4000
    if (!newPlan.price || isNaN(newPlan.price) || Number(newPlan.price) <= 0) {
      errors.price = "Price must be a valid positive number.";
    } else {
      if (
        newPlan.plan.trim() !== "1-month" &&
        newPlan.plan.trim() !== "3-month" &&
        Number(newPlan.price) <= 4000
      ) {
        errors.price =
          "For plans longer than 3 months, price must be greater than ₹4000.";
      }
    }

    // Personal Trainer Charge validations
    if (newPlan.personalTrainerAvailable) {
      const charge = Number(newPlan.personalTrainerCharge);
      const price = Number(newPlan.price);

      // Check if trainer charge is valid and meets minimum value
      if (
        newPlan.personalTrainerCharge === "" ||
        isNaN(charge) ||
        charge < 1000
      ) {
        errors.personalTrainerCharge = "Trainer fee must be at least ₹1000.";
      } else if (charge > price / 4) {
        // Trainer fee must not exceed 1/4 of the plan price
        errors.personalTrainerCharge = `Trainer fee must not exceed 1/4 of the Plan price.<br>Which is ₹${price / 4
          } ( 1/4 * ₹${price} ).`;
      }
    }

    // Discount validation
    if (
      newPlan.discount === "" ||
      isNaN(newPlan.discount) ||
      Number(newPlan.discount) < 0 ||
      Number(newPlan.discount) > 100
    ) {
      errors.discount = "Discount must be a number between 0 and 100.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({}); // Clear errors

    try {
      const formData = new FormData();

      formData.append("plan", newPlan.plan);
      formData.append("title", newPlan.title);
      formData.append("description", newPlan.description);
      formData.append("duration", newPlan.duration);
      formData.append("price", Number(newPlan.price));
      formData.append(
        "personalTrainerAvailable",
        newPlan.personalTrainerAvailable
      );
      formData.append(
        "personalTrainerCharge",
        Number(newPlan.personalTrainerCharge || 0)
      );
      formData.append("discount", Number(newPlan.discount));

      newPlan.benefits.forEach((benefit) => {
        formData.append("benefits[]", benefit);
      });

      await http.post("/membership-plans/new-membership-plan",
        formData);

      setShowAddModal(false);
      setNewPlan(initialPlanState);
      toast.success("Membership plan added successfully!");
      fetchPlans();
    } catch (error) {
      console.error("Error adding membership plan:", error);
      toast.error("Failed to add membership plan.");
    }
  };

  // Handle Edit Plan
  const handleEditPlan = async () => {
    const errors = {};

    // Basic validation for required fields
    if (!editPlan.plan.trim()) errors.plan = "Plan is required.";
    if (!editPlan.title.trim()) errors.title = "Title is required.";
    if (!editPlan.description.trim())
      errors.description = "Description is required.";

    // Price validation
    if (
      !editPlan.price ||
      isNaN(editPlan.price) ||
      Number(editPlan.price) <= 0
    ) {
      errors.price = "Price must be a valid positive number.";
    }

    // Conditional price rule: if plan is not '1-month' and '3-month', price must be > ₹4000
    if (
      !editPlan.price ||
      isNaN(editPlan.price) ||
      Number(editPlan.price) <= 0
    ) {
      errors.price = "Price must be a valid positive number.";
    } else {
      if (
        editPlan.plan.trim() !== "1-month" &&
        editPlan.plan.trim() !== "3-month" &&
        Number(editPlan.price) <= 4000
      ) {
        errors.price =
          "For plans longer than 3 months, price must be greater than ₹4000.";
      }
    }

    // Personal Trainer Charge validations
    if (editPlan.personalTrainerAvailable) {
      const charge = Number(editPlan.personalTrainerCharge);
      const price = Number(editPlan.price);

      // Check if trainer charge is valid and meets minimum value
      if (
        editPlan.personalTrainerCharge === "" ||
        isNaN(charge) ||
        charge < 500
      ) {
        errors.personalTrainerCharge = "Trainer fee must be at least ₹1000.";
      } else if (charge > price / 4) {
        // Trainer fee must not exceed 1/4 of the plan price
        errors.personalTrainerCharge = `Trainer fee must not exceed 1/4 of the Plan price.<br>Which is ₹${price / 4
          } ( 1/4 * ₹${price} ).`;
      }
    }

    // Discount validation
    if (
      editPlan.discount === "" ||
      isNaN(editPlan.discount) ||
      Number(editPlan.discount) < 0 ||
      Number(editPlan.discount) > 100
    ) {
      errors.discount = "Discount must be a number between 0 and 100.";
    }

    // If there are errors, set them and stop
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({}); // Clear errors
    try {
      const formData = new FormData();

      formData.append("plan", editPlan.plan);
      formData.append("title", editPlan.title);
      formData.append("description", editPlan.description);
      formData.append("duration", editPlan.duration);
      formData.append("price", Number(editPlan.price));
      formData.append(
        "personalTrainerAvailable",
        editPlan.personalTrainerAvailable
      );
      formData.append(
        "personalTrainerCharge",
        Number(editPlan.personalTrainerCharge || 0)
      );
      formData.append("discount", Number(editPlan.discount));

      editPlan.benefits.forEach((benefit) => {
        formData.append("benefits[]", benefit);
      });

      // Make PUT request to update the plan
      await http.put(
        `/membership-plans/update-membership-plan/${editPlan._id}`,
        formData
      );

      setShowEditModal(false);
      setEditPlan(initialPlanState);
      toast.success("Membership plan updated successfully!");
      fetchPlans(); // Refresh the list after editing
    } catch (error) {
      console.error("Error updating membership plan:", error);
      toast.error("Failed to update membership plan.");
    }
  };

  const confirmDelete = async () => {
    try {
      await http.delete(
        `/membership-plans/delete-membership-plan/${deletePlanId}`
      );
      setShowDeleteModal(false);
      fetchPlans(); // Refresh list
      toast.success("Membership plan deleted successfully!");
    } catch (error) {
      console.error("Delete failed", error);
      toast.error("Failed to delete membership plan. Please try again.");
    }
  };

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1">
        <Header />
        <div className="container-xxl py-5">
          <h1>Membership Plans</h1>
          <div className="container plans-section border-4 border-blue-500 rounded-lg shadow-lg p-4">
            {loading ? (
              <p>Loading Membership Plans...</p>
            ) : (
              <div className="mb-4">
                <div className="d-flex justify-content-end mb-3">
                  <Button
                    variant="success"
                    onClick={() => setShowAddModal(true)}
                  >
                    + Add Plan
                  </Button>
                </div>

                <div className="table-responsive">
                  <table className="table table-dark table-striped table-bordered text-center">
                    <thead>
                      <tr>
                        <th>No</th>
                        <th>Title</th>
                        <th>Duration</th>
                        <th>Price</th>
                        <th>Trainer Fee</th>
                        <th>Trainer Availability</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plans
                        .slice(
                          (currentPage - 1) * rowsPerPage,
                          currentPage * rowsPerPage
                        )
                        .map((plan, index) => (
                          <tr key={plan._id}>
                            <td>
                              {(currentPage - 1) * rowsPerPage + index + 1}
                            </td>
                            <td>{plan.title}</td>
                            <td>{plan.duration} months</td>
                            <td>₹{plan.price}</td>
                            <td>₹{plan.personalTrainerCharge}</td>
                            <td>
                              <span
                                className={`badge ${plan.personalTrainerAvailable
                                  ? "bg-success"
                                  : "bg-danger"
                                  }`}
                              >
                                {plan.personalTrainerAvailable ? "Yes" : "No"}
                              </span>
                            </td>

                            <td>
                              <DropdownButton
                                variant="secondary"
                                title="Action"
                              >
                                <Dropdown.Item
                                  onClick={() => handleShowDetails(plan)}
                                >
                                  Details
                                </Dropdown.Item>
                                <Dropdown.Item
                                  onClick={() => handleShowEditModal(plan)}
                                >
                                  Edit
                                </Dropdown.Item>
                                <Dropdown.Item
                                  onClick={() => handleDeletePlan(plan._id)}
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
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className="me-2"
                      >
                        Previous
                      </Button>
                      <span>
                        Page {currentPage} of{" "}
                        {Math.max(1, Math.ceil(plans.length / rowsPerPage))}
                      </span>
                      <Button
                        variant="secondary"
                        onClick={() =>
                          setCurrentPage((prev) =>
                            prev < Math.ceil(plans.length / rowsPerPage)
                              ? prev + 1
                              : prev
                          )
                        }
                        disabled={
                          currentPage === Math.ceil(plans.length / rowsPerPage)
                        }
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
      {/* Modals (Add, Details, Edit) should follow here.*/}
      {/* Add Membership Plan Modal */}
      <Modal
        show={showAddModal}
        onHide={() => {
          setShowAddModal(false);
          setNewPlan(initialPlanState);
          setFormErrors({});
        }}
        centered
        className="custom-scroll"
      >
        <Modal.Header closeButton>
          <Modal.Title>Add Membership Plan</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form method="POST">
            {/* Plan Selection */}
            <Form.Group className="mb-3">
              <Form.Label>Plan</Form.Label>
              <Form.Control
                as="select"
                value={newPlan.plan}
                onChange={(e) => {
                  const selectedPlan = e.target.value;
                  const { title, duration } = planMapping[selectedPlan] || {};
                  setNewPlan((prev) => ({
                    ...prev,
                    plan: selectedPlan,
                    title: title || "",
                    duration: duration || 1,
                  }));
                }}
              >
                <option value="">----- Select Plan -----</option>
                {planOptions.map((option, idx) => {
                  const isUsed = plans.some((p) => p.plan === option);
                  return (
                    <option key={idx} value={option} disabled={isUsed}>
                      {option} {isUsed ? "(Already Added)" : ""}
                    </option>
                  );
                })}
              </Form.Control>
            </Form.Group>

            {/* Title */}
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={newPlan.title}
                readOnly
                isInvalid={!!formErrors.title}
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.title}
              </Form.Control.Feedback>
            </Form.Group>

            {/* Description */}
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newPlan.description}
                onChange={(e) =>
                  setNewPlan({ ...newPlan, description: e.target.value })
                }
                isInvalid={!!formErrors.description}
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.description}
              </Form.Control.Feedback>
            </Form.Group>

            {/* Duration */}
            <Form.Group className="mb-3">
              <Form.Label>Duration (months)</Form.Label>
              <Form.Control
                type="number"
                value={newPlan.duration}
                readOnly
                isInvalid={!!formErrors.duration}
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.duration}
              </Form.Control.Feedback>
            </Form.Group>

            {/* Price */}
            <Form.Group className="mb-3">
              <Form.Label>Price</Form.Label>
              <Form.Control
                type="number"
                value={newPlan.price}
                onChange={(e) =>
                  setNewPlan({ ...newPlan, price: e.target.value })
                }
                isInvalid={!!formErrors.price}
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.price}
              </Form.Control.Feedback>
            </Form.Group>

            {/* Trainer Available */}
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Trainer Available"
                checked={newPlan.personalTrainerAvailable}
                onChange={(e) =>
                  setNewPlan({
                    ...newPlan,
                    personalTrainerAvailable: e.target.checked,
                  })
                }
              />
            </Form.Group>

            {/* Trainer Fee */}
            {newPlan.personalTrainerAvailable && (
              <Form.Group className="mb-3">
                <Form.Label>Trainer Fee</Form.Label>
                <Form.Control
                  type="number"
                  value={newPlan.personalTrainerCharge}
                  onChange={(e) =>
                    setNewPlan({
                      ...newPlan,
                      personalTrainerCharge: e.target.value,
                    })
                  }
                  isInvalid={!!formErrors.personalTrainerCharge}
                />
                <Form.Control.Feedback type="invalid">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: formErrors.personalTrainerCharge,
                    }}
                  />
                </Form.Control.Feedback>
              </Form.Group>
            )}

            {/* Discount */}
            <Form.Group className="mb-3">
              <Form.Label>Discount (%)</Form.Label>
              <Form.Control
                type="number"
                value={newPlan.discount}
                onChange={(e) =>
                  setNewPlan({ ...newPlan, discount: e.target.value })
                }
                isInvalid={!!formErrors.discount}
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.discount}
              </Form.Control.Feedback>
            </Form.Group>

            {/* Benefits */}
            <Form.Group className="mb-3">
              <Form.Label>Benefits</Form.Label>
              <div>
                {newPlan.benefits?.map((benefit, index) => (
                  <div key={index} className="d-flex align-items-center mb-2">
                    <Form.Control
                      type="text"
                      value={benefit}
                      onChange={(e) => {
                        const updatedBenefits = [...newPlan.benefits];
                        updatedBenefits[index] = e.target.value;
                        setNewPlan({ ...newPlan, benefits: updatedBenefits });
                      }}
                    />
                    <Button
                      variant="danger"
                      size="sm"
                      className="ms-2"
                      onClick={() => {
                        const updatedBenefits = newPlan.benefits.filter(
                          (_, i) => i !== index
                        );
                        setNewPlan({ ...newPlan, benefits: updatedBenefits });
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  variant="secondary"
                  onClick={() => {
                    setNewPlan({
                      ...newPlan,
                      benefits: [...(newPlan.benefits || []), ""],
                    });
                  }}
                >
                  Add Benefit
                </Button>
              </div>
            </Form.Group>

            {/* Add Plan Button */}
            <Button variant="primary" onClick={handleAddPlan}>
              Add Plan
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Modal for Details */}
      <Modal
        show={showDetailsModal}
        onHide={() => setShowDetailsModal(false)}
        centered
        className="custom-scroll"
      >
        <Modal.Header closeButton>
          <Modal.Title>Membership Plan Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPlan && (
            <div>
              <p>
                <strong>Title:</strong> {selectedPlan.title}
              </p>
              <p>
                <strong>Description:</strong> {selectedPlan.description}
              </p>
              <p>
                <strong>Duration:</strong> {selectedPlan.duration} months
              </p>
              <p>
                <strong>Price:</strong> ₹{selectedPlan.price}
              </p>
              <p>
                <strong>Trainer Available:</strong>{" "}
                {selectedPlan.personalTrainerAvailable ? "Yes" : "No"}
              </p>
              <p>
                <strong>Trainer Fee:</strong> ₹
                {selectedPlan.personalTrainerCharge}
              </p>
              <p>
                <strong>Discount:</strong> {selectedPlan.discount}
              </p>
              <p>
                <strong>Benefits:</strong>
              </p>
              <ul>
                {selectedPlan.benefits?.map((benefit, idx) => (
                  <li key={idx}>{benefit}</li>
                ))}
              </ul>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Edit Membership Plan Modal */}
      <Modal
        show={showEditModal}
        onHide={() => {
          setShowEditModal(false);
          setNewPlan(initialPlanState);
          setFormErrors({});
        }}
        centered
        className="custom-scroll"
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Membership Plan</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form method="POST">
            {/* Plan Selection */}
            <Form.Group className="mb-3">
              <Form.Label>Plan</Form.Label>
              <Form.Control
                as="select"
                value={editPlan.plan}
                onChange={(e) => {
                  const selectedPlan = e.target.value;
                  const { title, duration } = planMapping[selectedPlan] || {};
                  setEditPlan((prev) => ({
                    ...prev,
                    plan: selectedPlan,
                    title: title || "",
                    duration: duration || 1,
                  }));
                }}
              >
                <option value="">----- Select Plan -----</option>
                {planOptions.map((option, idx) => {
                  const isUsed = plans.some((p) => p.plan === option);
                  return (
                    <option key={idx} value={option} disabled={isUsed}>
                      {option} {isUsed ? "(Already Added)" : ""}
                    </option>
                  );
                })}
              </Form.Control>
            </Form.Group>

            {/* Title */}
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={editPlan.title}
                readOnly
                isInvalid={!!formErrors.title}
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.title}
              </Form.Control.Feedback>
            </Form.Group>

            {/* Description */}
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={editPlan.description}
                onChange={(e) =>
                  setEditPlan({ ...editPlan, description: e.target.value })
                }
                isInvalid={!!formErrors.description}
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.description}
              </Form.Control.Feedback>
            </Form.Group>

            {/* Duration */}
            <Form.Group className="mb-3">
              <Form.Label>Duration (months)</Form.Label>
              <Form.Control
                type="number"
                value={editPlan.duration}
                readOnly
                isInvalid={!!formErrors.duration}
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.duration}
              </Form.Control.Feedback>
            </Form.Group>

            {/* Price */}
            <Form.Group className="mb-3">
              <Form.Label>Price</Form.Label>
              <Form.Control
                type="number"
                value={editPlan.price}
                onChange={(e) =>
                  setEditPlan({ ...editPlan, price: e.target.value })
                }
                isInvalid={!!formErrors.price}
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.price}
              </Form.Control.Feedback>
            </Form.Group>

            {/* Trainer Available */}
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Trainer Available"
                checked={editPlan.personalTrainerAvailable}
                onChange={(e) =>
                  setEditPlan({
                    ...editPlan,
                    personalTrainerAvailable: e.target.checked,
                  })
                }
              />
            </Form.Group>

            {/* Trainer Fee */}
            {editPlan.personalTrainerAvailable && (
              <Form.Group className="mb-3">
                <Form.Label>Trainer Fee</Form.Label>
                <Form.Control
                  type="number"
                  value={editPlan.personalTrainerCharge}
                  onChange={(e) =>
                    setEditPlan({
                      ...editPlan,
                      personalTrainerCharge: e.target.value,
                    })
                  }
                  isInvalid={!!formErrors.personalTrainerCharge}
                />
                <Form.Control.Feedback type="invalid">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: formErrors.personalTrainerCharge,
                    }}
                  />
                </Form.Control.Feedback>
              </Form.Group>
            )}

            {/* Discount */}
            <Form.Group className="mb-3">
              <Form.Label>Discount</Form.Label>
              <Form.Control
                type="number"
                value={editPlan.discount}
                onChange={(e) =>
                  setEditPlan({ ...editPlan, discount: e.target.value })
                }
                isInvalid={!!formErrors.discount}
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.discount}
              </Form.Control.Feedback>
            </Form.Group>

            {/* Benefits */}
            <Form.Group className="mb-3">
              <Form.Label>Benefits</Form.Label>
              <div>
                {editPlan.benefits?.map((benefit, index) => (
                  <div key={index} className="d-flex align-items-center mb-2">
                    <Form.Control
                      type="text"
                      value={benefit}
                      onChange={(e) => {
                        const updatedBenefits = [...editPlan.benefits];
                        updatedBenefits[index] = e.target.value;
                        setEditPlan({ ...editPlan, benefits: updatedBenefits });
                      }}
                    />
                    <Button
                      variant="danger"
                      size="sm"
                      className="ms-2"
                      onClick={() => {
                        const updatedBenefits = editPlan.benefits.filter(
                          (_, i) => i !== index
                        );
                        setEditPlan({ ...editPlan, benefits: updatedBenefits });
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditPlan({
                      ...editPlan,
                      benefits: [...(editPlan.benefits || []), ""],
                    });
                  }}
                >
                  Add Benefit
                </Button>
              </div>
            </Form.Group>

            {/* Edit Plan Button */}
            <Button variant="primary" onClick={handleEditPlan}>
              Save Changes
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
        className="custom-scroll"
      >
        <Modal.Header>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this membership plan?
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
    </div>
  );
};

export default MembershipPlans;
