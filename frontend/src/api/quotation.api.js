import axios from "axios";

const API_BASE = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/v1`;

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

// ── Quotation endpoints ──────────────────────────────────────
/** Submit or update a quotation */
export const submitQuotation = (payload) => api.post("/quotations", payload);

/** Get all quotations for an RFQ */
export const getQuotationsByRFQ = (rfqId) =>
  api.get("/quotations", { params: { rfqId } });

/** Get single quotation by ID */
export const getQuotationById = (id) => api.get(`/quotations/${id}`);

/** Get comparison matrix for an RFQ */
export const compareQuotations = (rfqId) =>
  api.get("/quotations/compare", { params: { rfqId } });

/** Get quotation count for an RFQ */
export const getQuotationCount = (rfqId) =>
  api.get("/quotations/count", { params: { rfqId } });

/** Select a winning quotation */
export const selectQuotation = (id) =>
  api.patch(`/quotations/${id}/select`);

export default api;
