// frontend/src/Components/Admin/Workout.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Dropdown, DropdownButton, Modal, Form, Badge } from "react-bootstrap";
import Sidebar from "./Sidebar";
import { Header } from "./Header";
import "./css/Staff.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { http } from "../../api/http";

const Workout = () => {
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState([]);
  const [allExercises, setAllExercises] = useState([]);
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
  const [editWorkout, setEditWorkout] = useState({ _id: "", title: "", exercises: [] });
  const [selectedExerciseToAdd, setSelectedExerciseToAdd] = useState("");

  useEffect(() => {
    fetchWorkouts();
    fetchAllExercises();
  }, []);

  const fetchWorkouts = async () => {
    try {
      const res = await http.get(`/workouts`);
      setWorkouts(res.data.data || []);
    } catch (error) {
      console.error("Error fetching workouts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllExercises = async () => {
    try {
      const res = await http.get(`/exercises`);
      setAllExercises(res.data.data || []);
    } catch (error) {
      console.error("Error fetching exercises:", error);
    }
  };

  // Exercises not already in the current workout being edited
  const availableExercises = allExercises.filter(
    (ex) => !editWorkout.exercises.some((e) => (e._id || e) === ex._id)
  );

  const handleAddWorkout = async () => {
    if (!newWorkoutTitle.trim()) { toast.warn("Please enter a title."); return; }
    try {
      const res = await http.post(`/workouts/new-workout`, { title: newWorkoutTitle, exercises: [] });
      setWorkouts((prev) => [...prev, res.data.data]);
      setShowAddModal(false);
      setNewWorkoutTitle("");
      toast.success("Workout added successfully!");
    } catch (err) {
      toast.error("Error adding workout.");
    }
  };

  const handleUpdateWorkout = async () => {
    try {
      const exerciseIds = editWorkout.exercises.map((e) => e._id || e);
      await http.put(`/workouts/update-workout/${editWorkout._id}`, {
        title: editWorkout.title,
        exercises: exerciseIds,
      });
      setWorkouts((prev) =>
        prev.map((w) => w._id === editWorkout._id
          ? { ...w, title: editWorkout.title, exercises: editWorkout.exercises }
          : w
        )
      );
      setShowEditModal(false);
      toast.success("Workout updated successfully!");
    } catch (err) {
      toast.error("Failed to update workout.");
    }
  };

  // Add exercise from dropdown to the edit list (not saved until "Save Changes")
  const handleAddExerciseToList = () => {
    if (!selectedExerciseToAdd) { toast.warn("Please select an exercise."); return; }
    const exercise = allExercises.find((e) => e._id === selectedExerciseToAdd);
    if (!exercise) return;
    setEditWorkout((prev) => ({ ...prev, exercises: [...prev.exercises, exercise] }));
    setSelectedExerciseToAdd("");
  };

  // Soft delete: remove from workout list only, doesn't touch ExerciseSchema
  const handleRemoveExercise = (index) => {
    setEditWorkout((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index),
    }));
  };

  const confirmDelete = async () => {
    try {
      await http.delete(`/workouts/delete-workout/${deleteWorkoutId}`);
      setShowDeleteModal(false);
      setWorkouts((prev) => prev.filter((w) => w._id !== deleteWorkoutId));
      toast.success("Workout deleted!");
    } catch (error) {
      toast.error("Failed to delete workout.");
    }
  };

  const totalPages = Math.max(1, Math.ceil(workouts.length / rowsPerPage));
  const currentWorkouts = workouts.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1">
        <Header />
        <div className="container-xxl py-5">
          <h1 className="text-center">Workout Management</h1>
          <div className="container workout-section border-4 rounded-lg shadow-lg p-4">
            {loading ? (
              <p>Loading Workouts...</p>
            ) : (
              <div className="mb-4">
                <div className="d-flex justify-content-end mb-3">
                  <Button variant="primary" onClick={() => setShowAddModal(true)}>+ Add Workout</Button>
                </div>
                <div className="table-responsive">
                  <table className="table table-dark table-striped table-bordered text-center w-100">
                    <thead>
                      <tr><th>Title</th><th>Total Exercises</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {currentWorkouts.length > 0 ? currentWorkouts.map((workout) => (
                        <tr key={workout._id}>
                          <td>{workout.title}</td>
                          <td>{workout.exercises?.length || 0}</td>
                          <td>
                            <DropdownButton variant="secondary" title="Action">
                              <Dropdown.Item onClick={() => { setSelectedWorkout(workout); setShowDetailsModal(true); }}>Details</Dropdown.Item>
                              <Dropdown.Item onClick={() => {
                                setEditWorkout({ _id: workout._id, title: workout.title, exercises: [...(workout.exercises || [])] });
                                setSelectedExerciseToAdd("");
                                setShowEditModal(true);
                              }}>Edit</Dropdown.Item>
                              <Dropdown.Item className="text-danger" onClick={() => { setDeleteWorkoutId(workout._id); setShowDeleteModal(true); }}>Delete</Dropdown.Item>
                            </DropdownButton>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan="3">No workouts available.</td></tr>
                      )}
                    </tbody>
                  </table>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <Form.Select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="w-auto" style={{ height: 45 }}>
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

      {/* Add Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Add New Workout</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Workout Title</Form.Label>
            <Form.Control type="text" placeholder="e.g. Gym Workout" value={newWorkoutTitle} onChange={(e) => setNewWorkoutTitle(e.target.value)} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
          <Button variant="success" onClick={handleAddWorkout}>Save</Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered size="lg">
        <Modal.Header closeButton><Modal.Title>Edit Workout</Modal.Title></Modal.Header>
        <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>

          {/* Title field */}
          <Form.Group className="mb-4">
            <Form.Label style={{ color: "#FFD700", fontWeight: "bold", textTransform: "uppercase" }}>
              Workout Title
            </Form.Label>
            <Form.Control
              type="text"
              value={editWorkout.title}
              onChange={(e) => setEditWorkout({ ...editWorkout, title: e.target.value })}
            />
          </Form.Group>

          {/* Current exercises list */}
          <Form.Label style={{ color: "#FFD700", fontWeight: "bold", textTransform: "uppercase" }}>
            Exercises ({editWorkout.exercises.length})
          </Form.Label>

          {editWorkout.exercises.length === 0 ? (
            <p className="text-muted mb-3">No exercises yet. Add one below.</p>
          ) : (
            <div className="mb-3">
              {editWorkout.exercises.map((exercise, index) => (
                <div
                  key={exercise._id || index}
                  className="d-flex align-items-center justify-content-between mb-2 p-2 rounded"
                  style={{ background: "#1e1e2e", border: "1px solid #444" }}
                >
                  <div className="d-flex align-items-center gap-3">
                    {exercise.image && (
                      <img
                        src={exercise.image.startsWith("http") ? exercise.image : `/Images/${exercise.image}`}
                        alt={exercise.name}
                        style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6 }}
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    )}
                    <div>
                      <strong style={{ color: "#fff" }}>{exercise.name}</strong>
                      {(exercise.sets || exercise.reps) && (
                        <div className="mt-1">
                          <Badge bg="secondary" className="me-1">{exercise.sets} sets</Badge>
                          <Badge bg="secondary">{exercise.reps} reps</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* SOFT DELETE — removes ObjectId from Workout.exercises only */}
                  <Button variant="outline-danger" size="sm" onClick={() => handleRemoveExercise(index)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add exercise section */}
          <div className="p-3 rounded mt-2" style={{ background: "#1a1a2e", border: "1px dashed #FFD700" }}>
            <Form.Label style={{ color: "#FFD700", fontWeight: "bold" }}>+ Add Exercise</Form.Label>
            {availableExercises.length === 0 ? (
              <p className="text-muted mb-0" style={{ fontSize: 13 }}>
                {allExercises.length === 0
                  ? "No exercises in database. Create exercises from the Exercises page first."
                  : "All exercises are already in this workout."}
              </p>
            ) : (
              <div className="d-flex gap-2 mt-2">
                <Form.Select
                  value={selectedExerciseToAdd}
                  onChange={(e) => setSelectedExerciseToAdd(e.target.value)}
                  style={{ flex: 1 }}
                >
                  <option value="">-- Select an exercise --</option>
                  {availableExercises.map((ex) => (
                    <option key={ex._id} value={ex._id}>
                      {ex.name}{ex.sets ? ` — ${ex.sets}×${ex.reps}` : ""}
                    </option>
                  ))}
                </Form.Select>
                <Button variant="outline-warning" onClick={handleAddExerciseToList}>
                  Add
                </Button>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
          <Button variant="success" onClick={handleUpdateWorkout}>Save Changes</Button>
        </Modal.Footer>
      </Modal>

      {/* Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} centered size="lg">
        <Modal.Header closeButton><Modal.Title>Workout Details</Modal.Title></Modal.Header>
        <Modal.Body>
          {selectedWorkout && (
            <>
              <h4>{selectedWorkout.title}</h4>
              <hr />
              <h5>Exercises:</h5>
              {selectedWorkout.exercises?.length > 0 ? (
                <ul>{selectedWorkout.exercises.map((ex, i) => <li key={i}>{ex.name || ex}</li>)}</ul>
              ) : <p>No exercises added yet.</p>}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => navigate(`/admin/show-exercises/${selectedWorkout._id}`)}>Show Exercises</Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header><Modal.Title>Confirm Delete</Modal.Title></Modal.Header>
        <Modal.Body>Are you sure you want to delete this workout?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>Delete</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Workout;