// healthhub/src/Components/Login.js
import React, { useEffect, useState } from "react";
import Image from "../../assets/i.jpg";
import Logo from "../../assets/logo.png";
import GoogleSvg from "../../assets/icons8-google.svg";
import { FaEye, FaEyeSlash } from "react-icons/fa6";
import "../../css/Login.css";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { auth, provider, signInWithPopup } from "../../firebase";
import { http } from "../../api/http";

// Import your modal
import ForgotPasswordModal from "./ForgotPassword";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPopup, setShowForgotPopup] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("auth");
      if (token) {
        try {
          await http.get("/auth/me");
          navigate("/profile");
        } catch (error) {
          localStorage.removeItem("auth");
          localStorage.removeItem("user");
        }
      }
    };
    checkAuth();
  }, [navigate]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const email = e.target.email.value;
    const password = e.target.password.value;

    if (!email || !password) {
      toast.error("Please fill all inputs");
      setIsLoading(false);
      return;
    }

    try {
      const response = await http.post("/auth/login",
        { email, password }
      );

      const token = response.data.token;
      const userData = {
        displayName: response.data.user.name || email,
        email: response.data.user.email,
      };

      localStorage.setItem("auth", JSON.stringify(token));
      localStorage.setItem("user", JSON.stringify(userData));

      window.dispatchEvent(new Event("authChange"));

      toast.success("Login successful");
      navigate("/profile");
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Login failed";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();

      const response = await http.post(
        "/auth/google-login",
        { token: idToken }
      );

      localStorage.setItem("auth", JSON.stringify(response.data.token));
      localStorage.setItem(
        "user",
        JSON.stringify({
          displayName: user.displayName || user.email,
          email: user.email,
        })
      );

      window.dispatchEvent(new Event("authChange"));

      toast.success("Google Login successful");
      navigate("/profile");
    } catch (error) {
      toast.error(error.message || "Google login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-main">
      <div className="login-left">
        <img src={Image} alt="" />
      </div>
      <div className="login-right">
        <div className="login-right-container">
          <div className="login-logo">
            <img src={Logo} alt="" />
          </div>
          <div className="login-center">
            <h2>Welcome back!</h2>
            <p>Please enter your details</p>
            <form onSubmit={handleLoginSubmit}>
              <input type="email" placeholder="Email" name="email" />
              <div className="pass-input-div">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  name="password"
                />
                {showPassword ? (
                  <FaEyeSlash onClick={() => setShowPassword(!showPassword)} />
                ) : (
                  <FaEye onClick={() => setShowPassword(!showPassword)} />
                )}
              </div>

              <div className="login-center-options">
                <div className="remember-div">
                  <input type="checkbox" id="remember-checkbox" />
                  <label htmlFor="remember-checkbox">
                    Remember for 30 days
                  </label>
                </div>
                <button
                  type="button"
                  className="forgot-pass-link"
                  onClick={() => setShowForgotPopup(true)}
                >
                  Forgot password?
                </button>
              </div>
              <div className="login-center-buttons">
                <button type="submit" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Log In"}
                </button>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <img src={GoogleSvg} alt="" />
                  {isLoading ? "Logging in..." : "Log In with Google"}
                </button>
              </div>
            </form>
          </div>

          <p className="login-bottom-p">
            Don't have an account? <Link to="/register">Sign Up</Link>
          </p>
        </div>
      </div>

      {/* ✅ Use the ForgotPasswordModal instead of inline popup */}
      <ForgotPasswordModal
        show={showForgotPopup}
        onHide={() => setShowForgotPopup(false)}
      />
    </div>
  );
};

export default Login;
