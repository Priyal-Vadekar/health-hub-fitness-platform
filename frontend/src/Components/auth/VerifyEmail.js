import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "../../css/VerifyEmail.css";
import { http } from "../../api/http";

const VerifyEmailModal = ({ show, onHide, email }) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Handle verification
  const handleVerify = async () => {
    if (!code) {
      toast.error("Please enter the 6-digit code");
      return;
    }

    setLoading(true);
    try {
      const response = await http.post(
        "/auth/verify-email",
        {
          email,
          code,
        }
      );

      toast.success(response.data.message || "Email verified successfully!");
      setTimeout(() => {
        navigate("/login"); // redirect to login after success
      }, 2000);
    } catch (err) {
      console.log("VerifyEmail error:", err.response?.data); // debug
      const errorMsg =
        err.response?.data?.message ||
        "The code is incorrect. Please try again.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Resend code
  const handleResend = async (e) => {
    e.preventDefault();
    try {
      await http.post("/auth/resend-verification", {
        email,
      });
      toast.info("A new code has been sent to your email.");
    } catch {
      toast.error("Error resending code. Try again later.");
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Email Verification</Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center">
        <p>
          We sent a <b>6-digit verification code</b> to <br />
          <span style={{ color: "#ff7f00" }}>{email}</span>
        </p>

        {/* Verification input */}
        <Form.Control
          type="text"
          placeholder="Enter 6-digit code"
          value={code}
          maxLength={6}
          onChange={(e) => setCode(e.target.value)}
          className="mb-3 text-center"
        />

        <Button
          onClick={handleVerify}
          variant="primary"
          className="w-100"
          disabled={loading}
        >
          {loading ? "Verifying..." : "Verify Email"}
        </Button>

        <div className="mt-3">
          <small>
            Didn’t receive the code?{" "}
            <a href="#" onClick={handleResend}>
              Resend
            </a>
          </small>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default VerifyEmailModal;
