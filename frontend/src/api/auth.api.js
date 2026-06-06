import axios from "axios";

const API_BASE = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/v1`;

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Send cookies (JWT auth)
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: attach Bearer token from localStorage ──
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: normalize error messages ──
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message || error.message || "An error occurred";
    return Promise.reject(new Error(message));
  }
);

// ── Auth endpoints ────────────────────────────────────────────
export const registerUser = (payload) => api.post("/auth/register", payload);
export const loginUser = (payload) => api.post("/auth/login", payload);
export const logoutUser = () => api.post("/auth/logout");
export const getCurrentUser = () => api.get("/auth/me");
export const refreshToken = () => api.post("/auth/refresh-token");

export default api;
