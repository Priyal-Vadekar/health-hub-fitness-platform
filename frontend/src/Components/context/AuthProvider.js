// import React, { createContext, useState, useEffect } from "react";
// import { getAuth, onAuthStateChanged } from "firebase/auth";

// export const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const auth = getAuth();
//     const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
//       setUser(currentUser);
//       setLoading(false);
//     });

//     return () => unsubscribe();
//   }, []);

//   return (
//     <AuthContext.Provider value={{ user, setUser, loading }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// frontend/src/Components/context/AuthProvider.js
import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ── FIX: Original code used Firebase onAuthStateChanged which only
    // tracks Google users. Email/password users were invisible to it,
    // so user in context was always null for them — causing the header
    // to show "Login / Signup" even when the user was logged in.
    //
    // Now we read directly from localStorage (where Login.js stores the
    // user after both email/password and Google login).

    const loadUserFromStorage = () => {
      try {
        const token = localStorage.getItem("auth");
        const storedUser = localStorage.getItem("user");

        if (token && storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          setUser(null);
        }
      } catch {
        // Corrupted localStorage — clean up and log out
        localStorage.removeItem("auth");
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUserFromStorage();

    // Listen for auth changes dispatched by Login.js, Header.js, http.js
    // All three now consistently use the "authChange" event name
    const handleAuthChange = () => loadUserFromStorage();
    window.addEventListener("authChange", handleAuthChange);

    return () => {
      window.removeEventListener("authChange", handleAuthChange);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};