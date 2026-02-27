import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";

const ForgotPasswordModal = ({ show, onHide }) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post("http://localhost:5000/api/auth/forgot-password", {
        email,
      });
      toast.success("Password reset email sent! Check your inbox.");
      setEmail("");
      onHide();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error sending email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Password Reset</Modal.Title>
      </Modal.Header>

      <Modal.Body className="text-center">
        <p className="mb-3" style={{ color: "#ddd" }}>
          Enter your registered email and we’ll send you a link to reset your
          password.
        </p>

        <Form onSubmit={handleSubmit}>
          <Form.Control
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-3 text-center"
            style={{ color: "white", backgroundColor: "#2c2c2c" }} // match dark theme
            required
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
                Sending...
              </>
            ) : (
              "Send Reset Link"
            )}
          </Button>
        </Form>

        <div className="mt-3">
          <small className="text-muted">
            Remember your password?{" "}
            <a href="/login" style={{ textDecoration: "underline" }}>
              Sign in here
            </a>
          </small>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default ForgotPasswordModal;
