import axios from "axios";

const API_BASE = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/v1`;

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Attach Bearer token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Normalize error messages
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message || error.message || "An error occurred";
    return Promise.reject(new Error(message));
  }
);

// ── Vendor endpoints ────────────────────────────────────────
/** Get all vendors with optional filters */
export const getAllVendors = (params = {}) => api.get("/vendors", { params });

/** Get active vendors only — for RFQ assignment dropdowns */
export const getActiveVendors = () => api.get("/vendors/active");

/** Get single vendor by ID */
export const getVendorById = (id) => api.get(`/vendors/${id}`);

/** Register a new vendor */
export const createVendor = (payload) => api.post("/vendors", payload);

/** Update vendor profile fields */
export const updateVendor = (id, payload) => api.patch(`/vendors/${id}`, payload);

/** Update vendor status: Active | Inactive | Blocked */
export const updateVendorStatus = (id, status) =>
  api.patch(`/vendors/${id}/status`, { status });

export default api;
