import axios from "axios";

const API_BASE = "http://localhost:5000/api/v1";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Send cookies (JWT auth)
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request Interceptor — attach token from localStorage as fallback ──
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor — standardize error messages ──
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message || error.message || "An error occurred";
    return Promise.reject(new Error(message));
  }
);

// ================================================================
// RFQ API Functions
// ================================================================

/**
 * Create a new RFQ
 * @param {Object} payload - { title, category, deadline, description, lineItems, assignedVendors, sendToVendors }
 */
export const createRFQ = (payload) => api.post("/rfqs", payload);

/**
 * Get all RFQs with optional filters
 * @param {Object} params - { status, search, page, limit }
 */
export const getAllRFQs = (params = {}) => api.get("/rfqs", { params });

/**
 * Get a single RFQ by ID
 * @param {string} id
 */
export const getRFQById = (id) => api.get(`/rfqs/${id}`);

/**
 * Update an RFQ (Draft only)
 * @param {string} id
 * @param {Object} payload
 */
export const updateRFQ = (id, payload) => api.patch(`/rfqs/${id}`, payload);

/**
 * Cancel/delete an RFQ
 * @param {string} id
 */
export const deleteRFQ = (id) => api.delete(`/rfqs/${id}`);

/**
 * Get RFQ dashboard stats
 */
export const getRFQStats = () => api.get("/rfqs/stats");

// ================================================================
// Vendor / User API Functions (for assigning vendors to RFQs)
// ================================================================

/**
 * Get all vendors (active only) for the vendor selector
 */
export const getVendors = (params = {}) =>
  api.get("/users", { params: { role: "vendor", ...params } });

export default api;
