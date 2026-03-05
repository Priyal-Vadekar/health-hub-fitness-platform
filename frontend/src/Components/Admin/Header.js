import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import logo from "../../assets/fitness.jpg";
import "./css/header.css";
import { http } from "../../api/http";

export const Header = () => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("auth");
        if (!token) {
          setUser(null);
          setIsLoading(false);
          return;
        }

        // Verify token and get user data
        const response = await http.get("/auth/me");

        if (response.data) {
          const userData = {
            displayName: response.data.name || response.data.email,
            email: response.data.email,
          };
          setUser(userData);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        // If token is invalid, clear storage
        localStorage.removeItem("auth");
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const handleStorageChange = (event) => {
      if (event.key === "auth" || event.key === "user") {
        checkAuth();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("authChange", checkAuth);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("authChange", checkAuth);
    };
  }, []);

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      await http.post("/auth/logout");

      localStorage.removeItem("user");
      localStorage.removeItem("auth");
      setUser(null);

      window.dispatchEvent(new Event("storage"));
      navigate("/login");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  if (isLoading) {
    return null; // or a loading spinner
  }

  return (
    <header className="header navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
      <div className="container-fluid d-flex justify-content-between align-items-center px-3">
        {/* Left - Logo */}
        <div onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          <img src={logo} alt="Health Hub Logo" className="logo" width="100" />
        </div>

        {/* Right - Settings & User Dropdown */}
        <div className="d-flex align-items-center">
          <button
            className="btn btn-outline-light me-3"
            onClick={() => navigate("/settings")}
          >
            <i className="fa-solid fa-gear"></i>
          </button>

          {/* User Dropdown */}
          <div className="dropdown">
            <button
              className="btn btn-outline-light dropdown-toggle"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              {user ? user.displayName || user.email : "User"}
            </button>
            <ul
              className={`dropdown-menu dropdown-menu-end ${dropdownOpen ? "show" : ""
                }`}
            >
              <li>
                <a
                  className="dropdown-item"
                  href="http://localhost:3000/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Frontend
                </a>
              </li>
              <li>
                <button className="dropdown-item" onClick={handleLogout}>
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
};
