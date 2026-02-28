// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { getAuth, signOut } from "firebase/auth";
// import axios from "axios";
// import logo from "../../assets/fitness.jpg";
// import '../../css/header.css';

// const Header = () => {
//   const navigate = useNavigate();
//   const [isScrolled, setIsScrolled] = useState(false);
//   const [user, setUser] = useState(null);
//   const [role, setRole] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     const handleScroll = () => setIsScrolled(window.scrollY > 0);
//     window.addEventListener("scroll", handleScroll);

//     const checkAuth = async () => {
//       try {
//         const token = localStorage.getItem("auth");
//         if (!token) {
//           setUser(null);
//           setRole(null);
//           setIsLoading(false);
//           return;
//         }

//         const response = await axios.get("http://localhost:5000/api/auth/me", {
//           headers: { Authorization: `Bearer ${JSON.parse(token)}` }
//         });

//         if (response.data) {
//           const userData = {
//             displayName: response.data.name || response.data.email,
//             email: response.data.email,
//           };
//           setUser(userData);
//           setRole(response.data.role);
//         }
//       } catch (error) {
//         console.error("Auth check error:", error);
//         localStorage.removeItem("auth");
//         localStorage.removeItem("user");
//         setUser(null);
//         setRole(null);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     checkAuth();

//     const handleStorageChange = (event) => {
//       if (event.key === "auth" || event.key === "user") {
//         checkAuth();
//       }
//     };
//     window.addEventListener("storage", handleStorageChange);
//     window.addEventListener("authChange", checkAuth);

//     return () => {
//       window.removeEventListener("scroll", handleScroll);
//       window.removeEventListener("storage", handleStorageChange);
//       window.removeEventListener("authChange", checkAuth);
//     };
//   }, []);

//   const handleLogout = async () => {
//     try {
//       const auth = getAuth();
//       await signOut(auth);
//       await axios.post("http://localhost:5000/api/auth/logout");

//       localStorage.removeItem("user");
//       localStorage.removeItem("auth");
//       setUser(null);
//       setRole(null);

//       window.dispatchEvent(new Event("storage"));
//       navigate("/login");
//     } catch (error) {
//       console.error("Logout Error:", error);
//     }
//   };

//   if (isLoading) return null;

//   return (
//     <>
//       <style>
//         {`
//           .dropdown-menu {
//             right: 0;
//             left: auto;
//             min-width: 200px;
//           }
//           .dropdown:hover .dropdown-menu {
//             display: block;
//             margin-top: 0;
//           }
//           .dropdown-item {
//             white-space: nowrap;
//           }
//         `}
//       </style>
//       <nav className={`navbar navbar-expand-lg bg-dark navbar-dark ${isScrolled ? "nav-sticky" : ""}`} style={{ position: "fixed", top: 0, width: "100%", zIndex: 1000 }}>
//         <div className="container-fluid">
//           <img src={logo} alt="Health Hub Logo" className="logo" width="100" />
//           <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarCollapse">
//             <span className="navbar-toggler-icon" />
//           </button>
//           <div className="collapse navbar-collapse justify-content-end" id="navbarCollapse">
//             <ul className="navbar-nav">
//               <li className="nav-item"><span onClick={() => navigate("/")} className="nav-link">Home</span></li>
//               <li className="nav-item"><span onClick={() => navigate("/membership-plan")} className="nav-link">Membership Plan</span></li>
//               <li className="nav-item"><span onClick={() => navigate("/About")} className="nav-link">About Us</span></li>
//               <li className="nav-item"><span onClick={() => navigate("/Contact")} className="nav-link">Contact Us</span></li>

//               {user ? (
//                 <>
//                   <li className="nav-item"><span onClick={() => navigate("/Trainer")} className="nav-link">Trainer</span></li>
//                   <li className="nav-item"><span onClick={() => navigate("/Dietplan")} className="nav-link">Diet Plan</span></li>
//                   <li className="nav-item dropdown">
//                     <span className="nav-link dropdown-toggle" id="workoutDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">Workout</span>
//                     <ul className="dropdown-menu" aria-labelledby="workoutDropdown">
//                       <li><span onClick={() => navigate("/home-workouts")} className="dropdown-item">Home Workout</span></li>
//                       <li><span onClick={() => navigate("/gym-workouts")} className="dropdown-item">Gym Workout</span></li>
//                     </ul>
//                   </li>
//                   <li className="nav-item dropdown">
//                     <span className="nav-link dropdown-toggle" id="userDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
//                       {user.displayName || user.email}
//                     </span>
//                     <ul className="dropdown-menu" aria-labelledby="userDropdown">
//                       <li><span onClick={() => navigate("/profile")} className="dropdown-item">My Profile</span></li>

//                       {role === "Member" && (
//                         <>
//                           <li><span onClick={() => navigate("/member-dashboard")} className="dropdown-item">Member Dashboard</span></li>
//                         </>
//                       )}

//                       {role === "Trainer" && (
//                         <>
//                           <li><span onClick={() => navigate("/workout-management")} className="dropdown-item">Workout Management</span></li>
//                           <li><span onClick={() => navigate("/user-progress")} className="dropdown-item">Assigned Users</span></li>
//                           <li><span onClick={() => navigate("/diet-plan")} className="dropdown-item">Diet Plan Management</span></li>
//                         </>
//                       )}

//                       {(role === "RD" || role === "RDN") && (
//                         <>
//                           <li><span onClick={() => navigate("/dietitian")} className="dropdown-item">Dietitian Dashboard</span></li>
//                         </>
//                       )}

//                       {role === "Admin" && (
//                         <>
//                           <li><span onClick={() => navigate("/admin")} className="dropdown-item">Backend</span></li>
//                         </>
//                       )}

//                       <li><hr className="dropdown-divider" /></li>
//                       <li><span onClick={handleLogout} className="dropdown-item">Logout</span></li>
//                     </ul>
//                   </li>
//                 </>
//               ) : (
//                 <li className="nav-item"><span onClick={() => navigate("/Login")} className="nav-link">Login / Signup</span></li>
//               )}
//             </ul>
//           </div>
//         </div>
//       </nav>
//     </>
//   );
// };

// export default Header;

// frontend/src/Components/layout/Header.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import { http } from "../../api/http";
import logo from "../../assets/fitness.jpg";
import "../../css/header.css";

const Header = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  // ── Read auth state from localStorage (no API call on every page load)
  // ── FIX 1: Original Header called GET /api/auth/me on every mount.
  //    When the access token was expired (after 1 hour), this returned
  //    401/400 and the catch block immediately cleared localStorage and
  //    set user=null — logging the user out before the refresh interceptor
  //    in http.js ever got a chance to run.
  //
  // ── FIX 2: Original logout fired window.dispatchEvent(new Event("storage"))
  //    but Login.js and http.js fire "authChange". The event name mismatch
  //    meant logout didn't update the header state reliably.
  //    Now everything uses "authChange" consistently.
  //
  // ── FIX 3: We need the user's role, which is NOT stored in localStorage
  //    by Login.js (it only stores name + email). We fetch role from
  //    /api/auth/me ONCE using the http instance (which handles token
  //    refresh automatically via interceptor) and store it in state.
  //    If the token is expired, the interceptor refreshes it silently.

  const loadUser = () => {
    try {
      const token = localStorage.getItem("auth");
      const storedUser = localStorage.getItem("user");

      if (!token || !storedUser) {
        setUser(null);
        setRole(null);
        return false;
      }

      setUser(JSON.parse(storedUser));
      return true;
    } catch {
      setUser(null);
      setRole(null);
      return false;
    }
  };

  const fetchRole = async () => {
    try {
      // http instance automatically attaches token + handles refresh
      const response = await http.get("/auth/me");
      if (response.data) {
        setRole(response.data.role);
        // Also update stored user with latest name in case it changed
        const updatedUser = {
          displayName: response.data.name || response.data.email,
          email: response.data.email,
        };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    } catch (error) {
      // Only clear auth if it's truly a 401 after refresh attempt failed
      // The http interceptor already handles the redirect to /login
      // so we don't need to do anything extra here
      console.error("Failed to fetch user role:", error);
    }
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll);

    // Load from localStorage first (instant, no flash)
    const hasUser = loadUser();

    // Then fetch fresh role from API (uses http interceptor for refresh)
    if (hasUser) {
      fetchRole();
    }

    // Re-run when auth state changes (login, logout, token refresh)
    const handleAuthChange = () => {
      const hasUser = loadUser();
      if (hasUser) {
        fetchRole();
      }
    };

    window.addEventListener("authChange", handleAuthChange);

    // Also handle storage events from other tabs
    const handleStorageChange = (event) => {
      if (event.key === "auth" || event.key === "user") {
        handleAuthChange();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("authChange", handleAuthChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleLogout = async () => {
    try {
      // Sign out of Firebase (for Google login users)
      const firebaseAuth = getAuth();
      await signOut(firebaseAuth).catch(() => {
        // Ignore — user may not be logged in via Google
      });

      // Revoke refresh token on backend (uses http instance)
      await http.post("/auth/logout").catch(() => {
        // Ignore network errors during logout
      });
    } finally {
      // Always clear local state regardless of API success
      localStorage.removeItem("user");
      localStorage.removeItem("auth");
      setUser(null);
      setRole(null);

      // ── FIX: was "storage" event — now "authChange" to match
      //    Login.js, http.js and AuthProvider.js consistently
      window.dispatchEvent(new Event("authChange"));
      navigate("/login");
    }
  };

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
            cursor: pointer;
          }
          .nav-link {
            cursor: pointer;
          }
        `}
      </style>

      <nav
        className={`navbar navbar-expand-lg bg-dark navbar-dark ${isScrolled ? "nav-sticky" : ""}`}
        style={{ position: "fixed", top: 0, width: "100%", zIndex: 1000 }}
      >
        <div className="container-fluid">
          <img src={logo} alt="Health Hub Logo" className="logo" width="100" />
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarCollapse"
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div className="collapse navbar-collapse justify-content-end" id="navbarCollapse">
            <ul className="navbar-nav">
              <li className="nav-item">
                <span onClick={() => navigate("/")} className="nav-link">Home</span>
              </li>
              <li className="nav-item">
                <span onClick={() => navigate("/membership-plan")} className="nav-link">Membership Plan</span>
              </li>
              <li className="nav-item">
                <span onClick={() => navigate("/About")} className="nav-link">About Us</span>
              </li>
              <li className="nav-item">
                <span onClick={() => navigate("/Contact")} className="nav-link">Contact Us</span>
              </li>

              {user ? (
                <>
                  <li className="nav-item">
                    <span onClick={() => navigate("/Trainer")} className="nav-link">Trainer</span>
                  </li>
                  <li className="nav-item">
                    <span onClick={() => navigate("/Dietplan")} className="nav-link">Diet Plan</span>
                  </li>
                  <li className="nav-item dropdown">
                    <span
                      className="nav-link dropdown-toggle"
                      id="workoutDropdown"
                      role="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      Workout
                    </span>
                    <ul className="dropdown-menu" aria-labelledby="workoutDropdown">
                      <li><span onClick={() => navigate("/home-workouts")} className="dropdown-item">Home Workout</span></li>
                      <li><span onClick={() => navigate("/gym-workouts")} className="dropdown-item">Gym Workout</span></li>
                    </ul>
                  </li>

                  {/* User dropdown */}
                  <li className="nav-item dropdown">
                    <span
                      className="nav-link dropdown-toggle"
                      id="userDropdown"
                      role="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      {user.displayName || user.email}
                    </span>
                    <ul className="dropdown-menu" aria-labelledby="userDropdown">
                      <li>
                        <span onClick={() => navigate("/profile")} className="dropdown-item">My Profile</span>
                      </li>

                      {role === "Member" && (
                        <li>
                          <span onClick={() => navigate("/member-dashboard")} className="dropdown-item">Member Dashboard</span>
                        </li>
                      )}

                      {role === "Trainer" && (
                        <>
                          <li><span onClick={() => navigate("/workout-management")} className="dropdown-item">Workout Management</span></li>
                          <li><span onClick={() => navigate("/user-progress")} className="dropdown-item">Assigned Users</span></li>
                          <li><span onClick={() => navigate("/diet-plan")} className="dropdown-item">Diet Plan Management</span></li>
                        </>
                      )}

                      {(role === "RD" || role === "RDN") && (
                        <li>
                          <span onClick={() => navigate("/dietitian")} className="dropdown-item">Dietitian Dashboard</span>
                        </li>
                      )}

                      {role === "Admin" && (
                        <li>
                          <span onClick={() => navigate("/admin")} className="dropdown-item">Backend</span>
                        </li>
                      )}

                      <li><hr className="dropdown-divider" /></li>
                      <li>
                        <span onClick={handleLogout} className="dropdown-item">Logout</span>
                      </li>
                    </ul>
                  </li>
                </>
              ) : (
                <li className="nav-item">
                  <span onClick={() => navigate("/Login")} className="nav-link">Login / Signup</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Header;