// frontend/src/api/http.js
import axios from "axios";

// ── Relative baseURL so CRA proxy (package.json) handles routing
// This keeps cookies same-origin → sameSite:lax works correctly
// Absolute "http://localhost:5000/api" would break httpOnly cookie on cross-origin POST
const http = axios.create({
  baseURL: "/api",
  withCredentials: true, // send httpOnly refreshToken cookie on every request
});

// ─────────────────────────────────────────────────────────────────────────────
// Shared refresh state — used by BOTH interceptors so they don't fight each other
// ─────────────────────────────────────────────────────────────────────────────
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

// Helper — reads token from localStorage
// Your entire project uses the "auth" key (Login.js, Header.js, Register.js, Profile.js, firebase.js)
// Version 3's "token" key is NOT used anywhere in this project — don't change this
function getStoredToken() {
  try {
    const raw = localStorage.getItem("auth");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Helper — silently calls /api/auth/refresh-token and updates localStorage
// Returns the new access token string, or throws on failure
async function doRefresh() {
  // Use raw axios (not the http instance) to avoid triggering this interceptor recursively
  const refreshResp = await axios.post(
    "/api/auth/refresh-token",
    {},
    { withCredentials: true }
  );
  const newToken = refreshResp.data?.token;
  if (!newToken) throw new Error("No token received from refresh endpoint");
  localStorage.setItem("auth", JSON.stringify(newToken));
  return newToken;
}

// ─────────────────────────────────────────────────────────────────────────────
// REQUEST INTERCEPTOR
// ── Proactive refresh: if the stored access token will expire in <5 minutes,
//    refresh it NOW before the request goes out — instead of waiting for a 401.
//    This fixes the "email user logged out after 1h of idle" problem, because
//    the first request the user makes after coming back will trigger a silent
//    refresh rather than getting a 401 and having to retry.
// ─────────────────────────────────────────────────────────────────────────────
http.interceptors.request.use(
  async (config) => {
    let token = getStoredToken();

    if (token) {
      try {
        // Decode JWT payload (no signature check — client-side expiry check only)
        const payload = JSON.parse(atob(token.split(".")[1]));
        const expiresInMs = payload.exp * 1000 - Date.now();

        // Proactively refresh if token expires within 5 minutes
        if (expiresInMs < 5 * 60 * 1000 && !isRefreshing) {
          isRefreshing = true;
          try {
            token = await doRefresh();
          } catch {
            // Proactive refresh failed — clear and let the 401 handler below deal
            // with the actual request failure (don't force-logout here yet)
          } finally {
            isRefreshing = false;
          }
        }
      } catch {
        // Malformed JWT — leave token as-is, 401 handler will deal with it
      }

      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─────────────────────────────────────────────────────────────────────────────
// RESPONSE INTERCEPTOR
// ── Reactive refresh: if a request gets a 401 (token was already expired when
//    it hit the server), attempt a refresh and replay the original request.
//    This is the safety net for cases the proactive interceptor missed
//    (e.g. token expired between the request check and server receipt).
// ─────────────────────────────────────────────────────────────────────────────
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalConfig = error.config || {};
    const status = error.response ? error.response.status : 0;

    // Only handle 401 and avoid infinite retry loops
    // authMiddleware returns 401 (not 400) so this correctly triggers
    if (status === 401 && !originalConfig.__retry) {
      if (isRefreshing) {
        // Another request is already refreshing — queue this one and wait
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject, originalConfig });
        });
      }

      originalConfig.__retry = true;
      isRefreshing = true;

      try {
        const newToken = await doRefresh();
        isRefreshing = false;
        processQueue(null, newToken);

        // Replay the original failed request with the new token
        originalConfig.headers = originalConfig.headers || {};
        originalConfig.headers.Authorization = `Bearer ${newToken}`;
        return http(originalConfig);
      } catch (refreshErr) {
        isRefreshing = false;
        processQueue(refreshErr, null);

        // Refresh truly failed (refresh token expired or revoked) — log out
        localStorage.removeItem("auth");
        localStorage.removeItem("user");
        // Dispatch "authChange" — consistent with Login.js, Header.js, AuthContext.js
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