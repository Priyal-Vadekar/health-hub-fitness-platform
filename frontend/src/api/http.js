// import axios from "axios";

// // Create axios instance with base configuration
// const http = axios.create({
//   baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
//   withCredentials: true, // Important for httpOnly cookies (refresh token)
// });

// // Attach access token to outgoing requests
// http.interceptors.request.use(
//   (config) => {
//     const raw = localStorage.getItem("auth");
//     const token = raw ? JSON.parse(raw) : null;
//     if (token) {
//       config.headers = config.headers || {};
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// let isRefreshing = false;
// let pendingQueue = [];

// function processQueue(error, newToken) {
//   pendingQueue.forEach(({ resolve, reject, originalConfig }) => {
//     if (error) {
//       reject(error);
//     } else {
//       if (newToken) {
//         originalConfig.headers = originalConfig.headers || {};
//         originalConfig.headers.Authorization = `Bearer ${newToken}`;
//       }
//       resolve(http(originalConfig));
//     }
//   });
//   pendingQueue = [];
// }

// // Handle 401 responses with automatic token refresh
// http.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalConfig = error.config || {};
//     const status = error.response ? error.response.status : 0;

//     // Only handle 401 errors and avoid infinite loops
//     if (status === 401 && !originalConfig.__retry) {
//       if (isRefreshing) {
//         // If already refreshing, queue this request
//         return new Promise((resolve, reject) => {
//           pendingQueue.push({ resolve, reject, originalConfig });
//         });
//       }

//       originalConfig.__retry = true;
//       isRefreshing = true;

//       try {
//         // Attempt to refresh token using httpOnly cookie
//         const refreshResp = await axios.post(
//           `${
//             process.env.REACT_APP_API_URL || "http://localhost:5000"
//           }/api/auth/refresh-token`,
//           {},
//           { withCredentials: true }
//         );

//         const newToken = refreshResp.data && refreshResp.data.token;
//         if (newToken) {
//           localStorage.setItem("auth", JSON.stringify(newToken));
//           isRefreshing = false;
//           processQueue(null, newToken);

//           // Retry original request with new token
//           originalConfig.headers = originalConfig.headers || {};
//           originalConfig.headers.Authorization = `Bearer ${newToken}`;
//           return http(originalConfig);
//         } else {
//           throw new Error("No token received from refresh");
//         }
//       } catch (refreshErr) {
//         isRefreshing = false;
//         processQueue(refreshErr, null);

//         // Refresh failed - clear auth and redirect to login
//         localStorage.removeItem("auth");
//         localStorage.removeItem("user");
//         window.dispatchEvent(new Event("authChange"));

//         // Only redirect if not already on login page
//         if (window.location.pathname !== "/login") {
//           window.location.href = "/login";
//         }

//         return Promise.reject(refreshErr);
//       }
//     }

//     return Promise.reject(error);
//   }
// );

// // Export both default and named export for flexibility
// export default http;
// export { http };


// frontend/src/api/http.js
import axios from "axios";

// ── FIX: Use relative baseURL so the proxy in package.json handles routing
// Previously: "http://localhost:5000/api" → cross-origin → sameSite:lax cookie
// blocked on cross-origin POST → refresh always failed → user logged out
// Now: "/api" → same origin via CRA proxy → cookies work correctly
const http = axios.create({
  baseURL: "/api",
  withCredentials: true, // sends the httpOnly refreshToken cookie
});

// Attach access token to every outgoing request
http.interceptors.request.use(
  (config) => {
    const raw = localStorage.getItem("auth");
    const token = raw ? JSON.parse(raw) : null;
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let pendingQueue = [];

function processQueue(error, newToken) {
  pendingQueue.forEach(({ resolve, reject, originalConfig }) => {
    if (error) {
      reject(error);
    } else {
      if (newToken) {
        originalConfig.headers = originalConfig.headers || {};
        originalConfig.headers.Authorization = `Bearer ${newToken}`;
      }
      resolve(http(originalConfig));
    }
  });
  pendingQueue = [];
}

// Handle 401 responses — attempt token refresh before giving up
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalConfig = error.config || {};
    const status = error.response ? error.response.status : 0;

    // Only handle 401 and avoid infinite retry loops
    // ── FIX: authMiddleware now correctly returns 401 (was 400 before)
    //    so this interceptor will now actually trigger on expired tokens
    if (status === 401 && !originalConfig.__retry) {
      if (isRefreshing) {
        // Queue this request while refresh is in progress
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject, originalConfig });
        });
      }

      originalConfig.__retry = true;
      isRefreshing = true;

      try {
        // ── FIX: Use relative URL so proxy routes it correctly
        // Cookie is now sent because it's same-origin via proxy
        const refreshResp = await axios.post(
          "/api/auth/refresh-token",
          {},
          { withCredentials: true }
        );

        const newToken = refreshResp.data && refreshResp.data.token;
        if (newToken) {
          localStorage.setItem("auth", JSON.stringify(newToken));
          isRefreshing = false;
          processQueue(null, newToken);

          originalConfig.headers = originalConfig.headers || {};
          originalConfig.headers.Authorization = `Bearer ${newToken}`;
          return http(originalConfig);
        } else {
          throw new Error("No token received from refresh");
        }
      } catch (refreshErr) {
        isRefreshing = false;
        processQueue(refreshErr, null);

        // Refresh failed — clear everything and redirect to login
        localStorage.removeItem("auth");
        localStorage.removeItem("user");
        // ── FIX: dispatch "authChange" (consistent with Login.js and Header.js)
        window.dispatchEvent(new Event("authChange"));

        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }

        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default http;
export { http };