import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";

const ResetPasswordModal = ({ show, onHide }) => {
  const { token } = useParams(); // get token from URL
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    setIsLoading(true);
    try {
      await axios.post("http://localhost:5000/api/auth/reset-password", {
        token,
        newPassword: password,
      });

      toast.success("Password updated successfully!");
      setPassword("");
      setConfirmPassword("");

      onHide(); // close modal
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error resetting password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Reset Password</Modal.Title>
      </Modal.Header>

      <Modal.Body className="text-center">
        <p className="mb-3" style={{ color: "#ddd" }}>
          Enter your new password below to reset your account password.
        </p>

        <Form onSubmit={handleSubmit}>
          <Form.Control
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-3 text-center"
            style={{ color: "white", backgroundColor: "#2c2c2c" }}
            required
            minLength={6}
          />

          <Form.Control
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mb-3 text-center"
            style={{ color: "white", backgroundColor: "#2c2c2c" }}
            required
            minLength={6}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-100"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                ></span>
                Updating...
              </>
            ) : (
              "Update Password"
            )}
          </Button>
        </Form>

        <div className="mt-3">
          <small className="text-muted">
            Remembered your password?{" "}
            <a href="/login" style={{ textDecoration: "underline" }}>
              Sign in here
            </a>
          </small>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default ResetPasswordModal;
