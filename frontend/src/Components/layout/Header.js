import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import axios from "axios";
import logo from "../../assets/fitness.jpg";
import '../../css/header.css';

const Header = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll);

    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("auth");
        if (!token) {
          setUser(null);
          setRole(null);
          setIsLoading(false);
          return;
        }

        const response = await axios.get("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${JSON.parse(token)}` }
        });

        if (response.data) {
          const userData = {
            displayName: response.data.name || response.data.email,
            email: response.data.email,
          };
          setUser(userData);
          setRole(response.data.role);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        localStorage.removeItem("auth");
        localStorage.removeItem("user");
        setUser(null);
        setRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    const handleStorageChange = (event) => {
      if (event.key === "auth" || event.key === "user") {
        checkAuth();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("authChange", checkAuth);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("authChange", checkAuth);
    };
  }, []);

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      await axios.post("http://localhost:5000/api/auth/logout");

      localStorage.removeItem("user");
      localStorage.removeItem("auth");
      setUser(null);
      setRole(null);

      window.dispatchEvent(new Event("storage"));
      navigate("/login");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  if (isLoading) return null;

  return (
    <>
      <style>
        {`
          .dropdown-menu {
            right: 0;
            left: auto;
            min-width: 200px;
          }
          .dropdown:hover .dropdown-menu {
            display: block;
            margin-top: 0;
          }
          .dropdown-item {
            white-space: nowrap;
          }
        `}
      </style>
      <nav className={`navbar navbar-expand-lg bg-dark navbar-dark ${isScrolled ? "nav-sticky" : ""}`} style={{ position: "fixed", top: 0, width: "100%", zIndex: 1000 }}>
        <div className="container-fluid">
          <img src={logo} alt="Health Hub Logo" className="logo" width="100" />
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarCollapse">
            <span className="navbar-toggler-icon" />
          </button>
          <div className="collapse navbar-collapse justify-content-end" id="navbarCollapse">
            <ul className="navbar-nav">
              <li className="nav-item"><span onClick={() => navigate("/")} className="nav-link">Home</span></li>
              <li className="nav-item"><span onClick={() => navigate("/membership-plan")} className="nav-link">Membership Plan</span></li>
              <li className="nav-item"><span onClick={() => navigate("/About")} className="nav-link">About Us</span></li>
              <li className="nav-item"><span onClick={() => navigate("/Contact")} className="nav-link">Contact Us</span></li>

              {user ? (
                <>
                  <li className="nav-item"><span onClick={() => navigate("/Trainer")} className="nav-link">Trainer</span></li>
                  <li className="nav-item"><span onClick={() => navigate("/Dietplan")} className="nav-link">Diet Plan</span></li>
                  <li className="nav-item dropdown">
                    <span className="nav-link dropdown-toggle" id="workoutDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">Workout</span>
                    <ul className="dropdown-menu" aria-labelledby="workoutDropdown">
                      <li><span onClick={() => navigate("/home-workouts")} className="dropdown-item">Home Workout</span></li>
                      <li><span onClick={() => navigate("/gym-workouts")} className="dropdown-item">Gym Workout</span></li>
                    </ul>
                  </li>
                  <li className="nav-item dropdown">
                    <span className="nav-link dropdown-toggle" id="userDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                      {user.displayName || user.email}
                    </span>
                    <ul className="dropdown-menu" aria-labelledby="userDropdown">
                      <li><span onClick={() => navigate("/profile")} className="dropdown-item">My Profile</span></li>

                      {role === "Member" && (
                        <>
                          <li><span onClick={() => navigate("/member-dashboard")} className="dropdown-item">Member Dashboard</span></li>
                        </>
                      )}

                      {role === "Trainer" && (
                        <>
                          <li><span onClick={() => navigate("/workout-management")} className="dropdown-item">Workout Management</span></li>
                          <li><span onClick={() => navigate("/user-progress")} className="dropdown-item">Assigned Users</span></li>
                          <li><span onClick={() => navigate("/diet-plan")} className="dropdown-item">Diet Plan Management</span></li>
                        </>
                      )}

                      {(role === "RD" || role === "RDN") && (
                        <>
                          <li><span onClick={() => navigate("/dietitian")} className="dropdown-item">Dietitian Dashboard</span></li>
                        </>
                      )}

                      {role === "Admin" && (
                        <>
                          <li><span onClick={() => navigate("/admin")} className="dropdown-item">Backend</span></li>
                        </>
                      )}

                      <li><hr className="dropdown-divider" /></li>
                      <li><span onClick={handleLogout} className="dropdown-item">Logout</span></li>
                    </ul>
                  </li>
                </>
              ) : (
                <li className="nav-item"><span onClick={() => navigate("/Login")} className="nav-link">Login / Signup</span></li>
              )}
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Header;
