// frontend/src/Components/Admin/Workout.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button, Dropdown, DropdownButton, Modal, Form } from "react-bootstrap";
import Sidebar from "./Sidebar";
import { Header } from "./Header";
import "./css/Staff.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Workout = () => {
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteWorkoutId, setDeleteWorkoutId] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWorkoutTitle, setNewWorkoutTitle] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);

  // ── BUG FIX: Use a single unified state for the edit modal.
  // Original code had TWO separate states: editWorkout and editExercises.
  // The modal displayed editWorkout.exercises but "+ Add Exercise" pushed
  // to editExercises — a completely different array. New exercises never appeared.
  // handleUpdateWorkout also used editExercises (the wrong one).
  // Now everything goes through editWorkout — one source of truth.
  const [editWorkout, setEditWorkout] = useState({ _id: "", title: "", exercises: [] });

  const [showConfirmDeleteExercise, setShowConfirmDeleteExercise] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState(null);

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const fetchWorkouts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/workouts");
      setWorkouts(res.data.data || []);
    } catch (error) {
      console.error("Error fetching workouts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWorkout = async () => {
    if (!newWorkoutTitle.trim()) {
      toast.warn("Please enter a title.");
      return;
    }
    try {
      const res = await axios.post("http://localhost:5000/api/workouts/new-workout", {
        title: newWorkoutTitle,
        exercises: [],
      });
      setWorkouts((prev) => [...prev, res.data.data]);
      setShowAddModal(false);
      setNewWorkoutTitle("");
      toast.success("Workout added successfully!");
    } catch (err) {
      console.error("Failed to add workout:", err);
      toast.error("Error adding workout.");
    }
  };

  const handleUpdateWorkout = async () => {
    try {
      // ── FIX: Now uses editWorkout.title and editWorkout.exercises (single state)
      await axios.put(
        `http://localhost:5000/api/workouts/update-workout/${editWorkout._id}`,
        {
          title: editWorkout.title,
          exercises: editWorkout.exercises,
        }
      );
      setWorkouts((prev) =>
        prev.map((w) => (w._id === editWorkout._id ? { ...w, ...editWorkout } : w))
      );
      setShowEditModal(false);
      toast.success("Workout updated successfully!");
    } catch (err) {
      console.error("Error updating workout:", err);
      toast.error("Failed to update workout.");
    }
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/workouts/delete-workout/${deleteWorkoutId}`);
      setShowDeleteModal(false);
      setWorkouts((prev) => prev.filter((w) => w._id !== deleteWorkoutId));
      toast.success("Workout deleted successfully!");
    } catch (error) {
      console.error("Delete failed", error);
      toast.error("Failed to delete workout.");
    }
  };

  const currentWorkouts = workouts.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  const totalPages = Math.max(1, Math.ceil(workouts.length / rowsPerPage));

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1">
        <Header />
        <div className="container-xxl py-5">
          <h1 className="text-center">Workout Management</h1>
          <div className="container workout-section border-4 border-blue-500 rounded-lg shadow-lg p-4">
            {loading ? (
              <p>Loading Workouts...</p>
            ) : (
              <div className="mb-4">
                <div className="d-flex justify-content-end mb-3">
                  <Button variant="primary" onClick={() => setShowAddModal(true)}>
                    + Add Workout
                  </Button>
                </div>
                <div className="table-responsive">
                  <table className="table table-dark table-striped table-bordered text-center w-100">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Total Exercises</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentWorkouts.length > 0 ? (
                        currentWorkouts.map((workout) => (
                          <tr key={workout._id}>
                            <td>{workout.title}</td>
                            <td>{workout.exercises?.length || 0}</td>
                            <td>
                              <DropdownButton variant="secondary" title="Action">
                                <Dropdown.Item
                                  onClick={() => {
                                    setSelectedWorkout(workout);
                                    setShowDetailsModal(true);
                                  }}
                                >
                                  Details
                                </Dropdown.Item>
                                <Dropdown.Item
                                  onClick={() => {
                                    // ── FIX: Set editWorkout as a complete copy with title + exercises
                                    setEditWorkout({
                                      _id: workout._id,
                                      title: workout.title,
                                      exercises: [...(workout.exercises || [])],
                                    });
                                    setShowEditModal(true);
                                  }}
                                >
                                  Edit
                                </Dropdown.Item>
                                <Dropdown.Item
                                  className="text-danger"
                                  onClick={() => {
                                    setDeleteWorkoutId(workout._id);
                                    setShowDeleteModal(true);
                                  }}
                                >
                                  Delete
                                </Dropdown.Item>
                              </DropdownButton>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3">No workouts available.</td>
                        </tr>
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
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
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
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add New Workout</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Workout Title</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter workout title"
              value={newWorkoutTitle}
              onChange={(e) => setNewWorkoutTitle(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
          <Button variant="success" onClick={handleAddWorkout}>Save Workout</Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Workout</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label
                style={{ color: "#FFD700", fontWeight: "bold", textTransform: "uppercase" }}
              >
                Workout Title
              </Form.Label>
              {/* ── BUG FIX: Original had disabled prop AND broken onChange:
                  setEditTitle({ ...editWorkout, title: e.target.value })
                  which set editTitle to an object, not a string.
                  Now the field is enabled and updates editWorkout.title correctly. */}
              <Form.Control
                type="text"
                value={editWorkout.title}
                onChange={(e) =>
                  setEditWorkout({ ...editWorkout, title: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label
                style={{ color: "#FFD700", fontWeight: "bold", textTransform: "uppercase" }}
              >
                Exercises
              </Form.Label>

              {/* ── FIX: Render editWorkout.exercises (single state, not editExercises) */}
              {editWorkout.exercises.length === 0 && (
                <p className="text-muted">No exercises added yet. Click below to add one.</p>
              )}

              {editWorkout.exercises.map((exercise, index) => (
                <div key={exercise._id || index} className="mb-2 d-flex align-items-center gap-2">
                  <Form.Control
                    type="text"
                    value={exercise.name || exercise}
                    onChange={(e) => {
                      const updated = [...editWorkout.exercises];
                      // Handle both ObjectId-populated objects and plain strings
                      if (typeof updated[index] === "object") {
                        updated[index] = { ...updated[index], name: e.target.value };
                      } else {
                        updated[index] = e.target.value;
                      }
                      setEditWorkout({ ...editWorkout, exercises: updated });
                    }}
                    className="me-2"
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      setExerciseToDelete({
                        workoutId: editWorkout._id,
                        exerciseId: exercise._id,
                        index,
                      });
                      setShowConfirmDeleteExercise(true);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}

              {/* ── BUG FIX: Original pushed to editExercises (separate state, never rendered)
                  Now pushes directly into editWorkout.exercises so new items appear immediately */}
              <Button
                variant="outline-primary"
                className="mt-2"
                onClick={() =>
                  setEditWorkout({
                    ...editWorkout,
                    exercises: [...editWorkout.exercises, { name: "" }],
                  })
                }
              >
                + Add Exercise
              </Button>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleUpdateWorkout}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Workout Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedWorkout && (
            <>
              <h4>{selectedWorkout.title}</h4>
              <hr />
              <h5>Exercises:</h5>
              <ul>
                {selectedWorkout.exercises?.length > 0 ? (
                  selectedWorkout.exercises.map((ex, index) => (
                    <li key={index}>{ex.name || ex}</li>
                  ))
                ) : (
                  <p>No exercises added yet.</p>
                )}
              </ul>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="primary"
            onClick={() => navigate(`/admin/show-exercises/${selectedWorkout._id}`)}
          >
            Show Exercises
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Workout Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header><Modal.Title>Confirm Delete</Modal.Title></Modal.Header>
        <Modal.Body>Are you sure you want to delete this workout?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>Delete</Button>
        </Modal.Footer>
      </Modal>

      {/* Confirm Delete Exercise Modal */}
      <Modal show={showConfirmDeleteExercise} onHide={() => setShowConfirmDeleteExercise(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete Exercise</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to remove this exercise?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmDeleteExercise(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              try {
                if (exerciseToDelete?.exerciseId) {
                  await axios.delete(
                    `http://localhost:5000/api/exercises/delete-exercise/${exerciseToDelete.exerciseId}`
                  );
                }
                const updatedExercises = editWorkout.exercises.filter(
                  (_, idx) => idx !== exerciseToDelete.index
                );
                setEditWorkout({ ...editWorkout, exercises: updatedExercises });
                setShowConfirmDeleteExercise(false);
              } catch (err) {
                console.error("Failed to delete exercise:", err);
                toast.error("Error deleting exercise.");
              }
            }}
          >
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Workout;