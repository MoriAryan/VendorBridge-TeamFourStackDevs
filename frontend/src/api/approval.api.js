import axios from "axios";

const API_BASE = "http://localhost:5000/api/v1";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message || error.message || "An error occurred";
    return Promise.reject(new Error(message));
  }
);

/** List all approvals with optional ?status= filter */
export const getAllApprovals = (params = {}) =>
  api.get("/approvals", { params });

/** Create approval request for a winning quotation */
export const createApproval = (payload) =>
  api.post("/approvals", payload);

/** Get single approval by ID */
export const getApprovalById = (id) =>
  api.get(`/approvals/${id}`);

/** Get approval linked to a specific quotation */
export const getApprovalByQuotation = (quotationId) =>
  api.get(`/approvals/by-quotation/${quotationId}`);

/** Approve or reject a level in the chain */
export const decideApproval = (id, payload) =>
  api.patch(`/approvals/${id}/decide`, payload);

export default api;
