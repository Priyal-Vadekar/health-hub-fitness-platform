import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button, Form } from "react-bootstrap";
import Sidebar from "./Sidebar";
import { Header } from "./Header";
import "./css/Staff.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const RoleSimulator = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(false);
  const [simulationMode, setSimulationMode] = useState(false);
  const [simulatedRole, setSimulatedRole] = useState("");
  const [simulatedUser, setSimulatedUser] = useState(null);

  const getAuthToken = () => {
    const raw = localStorage.getItem("auth");
    return raw ? JSON.parse(raw) : null;
  };

  useEffect(() => {
    fetchUsersByRole();
  }, [selectedRole]);

  const fetchUsersByRole = async () => {
    if (!selectedRole) return;

    try {
      setLoading(true);
      const token = getAuthToken();
      const res = await axios.get(`${API_BASE}/users`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.data.success) {
        const filtered = (res.data.data || []).filter(
          (u) => u.role === selectedRole
        );
        setUsers((prev) => ({ ...prev, [selectedRole]: filtered }));
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleStartSimulation = () => {
    if (!selectedRole) {
      toast.error("Please select a role");
      return;
    }

    const userList = users[selectedRole] || [];
    const userToSimulate = selectedUserId
      ? userList.find((u) => u._id === selectedUserId)
      : null;

    setSimulatedRole(selectedRole);
    setSimulatedUser(userToSimulate);
    setSimulationMode(true);
    toast.success(
      `Simulating ${selectedRole} view${
        userToSimulate ? ` for ${userToSimulate.name}` : ""
      }`
    );
  };

  const handleStopSimulation = () => {
    setSimulationMode(false);
    setSimulatedRole("");
    setSimulatedUser(null);
    setSelectedRole("");
    setSelectedUserId("");
    toast.info("Simulation stopped");
  };

  const navigateToRoleDashboard = () => {
    switch (simulatedRole) {
      case "Member":
        navigate("/profile");
        break;
      case "Trainer":
        navigate("/workout-management");
        break;
      case "RD":
      case "RDN":
        navigate("/dietitian");
        break;
      case "Staff":
        navigate("/admin/staff");
        break;
      default:
        toast.error("No dashboard available for this role");
    }
  };

  if (simulationMode) {
    return (
      <div className="d-flex">
        <Sidebar />
        <div className="flex-grow-1">
          <Header />
          <div className="container-xxl py-5">
            <div className="alert alert-info d-flex justify-content-between align-items-center">
              <div>
                <strong>Simulation Mode Active</strong>
                <br />
                <small>
                  Role: <strong>{simulatedRole}</strong>
                  {simulatedUser &&
                    ` | User: ${simulatedUser.name} (${simulatedUser.email})`}
                </small>
              </div>
              <div>
                <Button
                  variant="primary"
                  className="me-2"
                  onClick={navigateToRoleDashboard}
                >
                  Go to {simulatedRole} Dashboard
                </Button>
                <Button variant="danger" onClick={handleStopSimulation}>
                  Stop Simulation
                </Button>
              </div>
            </div>

            <div className="container Users-section border-4 border-blue-500 rounded-lg shadow-lg p-4">
              <h2>Role Simulator - {simulatedRole} View</h2>
              <div className="mt-4">
                <h4>Simulated User Information:</h4>
                {simulatedUser ? (
                  <div className="card p-3">
                    <p>
                      <strong>Name:</strong> {simulatedUser.name}
                    </p>
                    <p>
                      <strong>Email:</strong> {simulatedUser.email}
                    </p>
                    <p>
                      <strong>Role:</strong> {simulatedUser.role}
                    </p>
                    {simulatedUser.assignedDietitian && (
                      <p>
                        <strong>Assigned Dietitian:</strong>{" "}
                        {simulatedUser.assignedDietitian}
                      </p>
                    )}
                    {simulatedUser.assignedTrainer && (
                      <p>
                        <strong>Assigned Trainer:</strong>{" "}
                        {simulatedUser.assignedTrainer}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted">
                    Generic {simulatedRole} view (no specific user selected)
                  </p>
                )}

                <div className="mt-4">
                  <h5>Available Actions:</h5>
                  <ul>
                    {simulatedRole === "Member" && (
                      <>
                        <li>View Profile</li>
                        <li>Track Progress</li>
                        <li>Log Meals</li>
                        <li>Book Trainer Sessions</li>
                        <li>View Diet Plans</li>
                      </>
                    )}
                    {simulatedRole === "Trainer" && (
                      <>
                        <li>Manage Workouts</li>
                        <li>Create Diet Plans</li>
                        <li>Track Member Progress</li>
                        <li>View Assigned Members</li>
                      </>
                    )}
                    {(simulatedRole === "RD" || simulatedRole === "RDN") && (
                      <>
                        <li>View Assigned Members</li>
                        <li>Manage Diet Plans</li>
                        <li>Review Meal Logs</li>
                        <li>Generate Reports</li>
                        <li>Manage Do's & Don'ts</li>
                      </>
                    )}
                    {simulatedRole === "Staff" && (
                      <>
                        <li>View Staff Dashboard</li>
                        <li>Manage Staff Operations</li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="mt-4">
                  <Button variant="primary" onClick={navigateToRoleDashboard}>
                    Open {simulatedRole} Dashboard
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1">
        <Header />
        <div className="container-xxl py-5">
          <h1>Role Simulator</h1>
          <div className="container Users-section border-4 border-blue-500 rounded-lg shadow-lg p-4">
            <div className="alert alert-warning">
              <strong>Note:</strong> This is a view-only simulation. You can
              preview how different roles see the system.
            </div>

            <Form className="mt-4">
              <Form.Group className="mb-3">
                <Form.Label>Select Role to Simulate</Form.Label>
                <Form.Select
                  value={selectedRole}
                  onChange={(e) => {
                    setSelectedRole(e.target.value);
                    setSelectedUserId("");
                  }}
                >
                  <option value="">-- Select Role --</option>
                  <option value="Member">Member</option>
                  <option value="Trainer">Trainer</option>
                  <option value="RD">RD (Registered Dietitian)</option>
                  <option value="RDN">RDN (Registered Dietitian Nutritionist)</option>
                  <option value="Staff">Staff</option>
                </Form.Select>
              </Form.Group>

              {selectedRole && (
                <Form.Group className="mb-3">
                  <Form.Label>Select Specific User (Optional)</Form.Label>
                  <Form.Select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    disabled={loading}
                  >
                    <option value="">
                      -- Generic View (No specific user) --
                    </option>
                    {(users[selectedRole] || []).map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </Form.Select>
                  {loading && (
                    <small className="text-muted">Loading users...</small>
                  )}
                </Form.Group>
              )}

              <Button
                variant="primary"
                onClick={handleStartSimulation}
                disabled={!selectedRole || loading}
              >
                Start Simulation
              </Button>
            </Form>

            <div className="mt-4">
              <h5>How it works:</h5>
              <ul>
                <li>Select a role to simulate (Member, Trainer, Dietitian, Staff)</li>
                <li>
                  Optionally select a specific user to see their personalized view
                </li>
                <li>Click "Start Simulation" to enter simulation mode</li>
                <li>Navigate to the role's dashboard to see their view</li>
                <li>Click "Stop Simulation" to return to admin view</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSimulator;
