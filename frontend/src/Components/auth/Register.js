// healthhub\src\Components\Register.js
import React, { useEffect, useState } from "react";
import Image from "../../assets/i.jpg";
import Logo from "../../assets/logo.png";
import GoogleSvg from "../../assets/icons8-google.svg";
import { FaEye, FaEyeSlash } from "react-icons/fa6";
import "../../css/Register.css";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { auth, provider } from "../../firebase";
import VerifyEmailModal from "./VerifyEmail";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const [token, setToken] = useState(
    JSON.parse(localStorage.getItem("auth")) || ""
  );
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  useEffect(() => {
    if (token !== "") {
      toast.success("You are already logged in!");
      toast.info("You are already logged in! Redirecting...");
      navigate("/dashboard");
    }
  }, []);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const lastname = e.target.lastname.value;
    const email = e.target.email.value;
    const password = e.target.password.value;
    const confirmPassword = e.target.confirmPassword.value;

    if (!name || !lastname || !email || !password || !confirmPassword) {
      toast.warn("Please fill all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      toast.warn("Passwords do not match");
      return;
    }

    const formData = {
      name: `${name} ${lastname}`,
      email,
      password,
      role: "Member",
    };
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/register",
        formData
      );
      toast.success(
        response.data.message ||
        "Registration successful! Please check your email for the verification code."
      );
      setRegisteredEmail(email); // store email to pass to modal
      setShowVerifyModal(true); // show popup
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Registration failed";
      toast.error(errorMessage);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken(); // ✅ Correct token retrieval

      const response = await axios.post(
        "http://localhost:5000/api/auth/google-login",
        { token: idToken },
        { withCredentials: true }
      );

      localStorage.setItem("auth", JSON.stringify(response.data.token));

      toast.info(`Welcome, ${user.displayName}! Google login successful.`);
      toast.success("Google Login successful");
      navigate("/dashboard");
    } catch (error) {
      console.error("Google Login Error:", error);
      toast.error(error.message || "Google login failed");
    }
  };

  return (
    <div className="register-main">
      <div className="register-left">
        <img src={Image} alt="Background" />
      </div>
      <div className="register-right">
        <div className="register-right-container">
          <div className="register-logo">
            <img src={Logo} alt="Logo" />
          </div>
          <div className="register-center">
            <h2>Welcome to our website!</h2>
            <p>Please enter your details</p>
            <form onSubmit={handleRegisterSubmit}>
              <input
                type="text"
                placeholder="First Name"
                name="name"
                required
              />
              <input
                type="text"
                placeholder="Last Name"
                name="lastname"
                required
              />
              <input type="email" placeholder="Email" name="email" required />

              <div className="pass-input-div">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  name="password"
                  required
                />
                {showPassword ? (
                  <FaEyeSlash onClick={() => setShowPassword(!showPassword)} />
                ) : (
                  <FaEye onClick={() => setShowPassword(!showPassword)} />
                )}
              </div>

              <div className="pass-input-div">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  name="confirmPassword"
                  required
                />
                {showConfirmPassword ? (
                  <FaEyeSlash
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                ) : (
                  <FaEye
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                )}
              </div>

              <div className="register-center-buttons">
                <button type="submit">Sign Up</button>
                <button type="button" onClick={handleGoogleSignup}>
                  <img src={GoogleSvg} alt="Google Icon" />
                  Sign Up with Google
                </button>
              </div>
            </form>
          </div>
          <VerifyEmailModal
            show={showVerifyModal}
            onHide={() => setShowVerifyModal(false)}
            email={registeredEmail}
          />

          <p className="login-bottom-p">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
