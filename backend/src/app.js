import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";

// ── Route Imports ──────────────────────────────────────────────────
import authRouter          from "./routes/auth.routes.js";
import rfqRouter           from "./routes/rfq.routes.js";
import vendorRouter        from "./routes/vendor.routes.js";
import quotationRouter     from "./routes/quotation.routes.js";
import approvalRouter      from "./routes/approval.routes.js";
import purchaseOrderRouter from "./routes/purchaseOrder.routes.js";
import invoiceRouter       from "./routes/invoice.routes.js";
import activityLogRouter   from "./routes/activityLog.routes.js";

// ── One-off controllers mounted directly ─────────────────────────
import { seedData }            from "./controllers/seed.controller.js";
import { getAnalyticsSummary } from "./controllers/analytics.controller.js";

const app = express();

// ── CORS ──────────────────────────────────────────────────────────
const frontendOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.CORS_ORIGIN,
].filter(Boolean);

app.use(cors({ origin: frontendOrigins, credentials: true }));

// ── Body Parsers ──────────────────────────────────────────────────
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(express.static("public"));

// ── Health ────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.status(200).json({ message: "VendorBridge backend is running", status: "OK" });
});

app.get("/api/v1/health", (req, res) => {
  const stateMap = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };
  res.status(200).json({
    service: "VendorBridge",
    api: "healthy",
    db: stateMap[mongoose.connection.readyState] || "unknown",
  });
});

// ── Dev seed ─────────────────────────────────────────────────────
app.get("/api/v1/seed", seedData);

// ── Analytics (read-only aggregation, no router needed) ──────────
app.get("/api/v1/analytics/summary", getAnalyticsSummary);

// ── API Routes — versioned at /api/v1/ ───────────────────────────
app.use("/api/v1/auth",           authRouter);
app.use("/api/v1/rfqs",           rfqRouter);
app.use("/api/v1/vendors",        vendorRouter);
app.use("/api/v1/quotations",     quotationRouter);
app.use("/api/v1/approvals",      approvalRouter);
app.use("/api/v1/purchase-orders", purchaseOrderRouter);
app.use("/api/v1/invoices",       invoiceRouter);
app.use("/api/v1/activity-logs",  activityLogRouter);

// ── 404 Handler ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ statusCode: 404, message: "Route not found", success: false });
});

// ── Global Error Handler ──────────────────────────────────────────
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  const errors = err.errors || [];

  res.status(statusCode).json({
    statusCode,
    message,
    success: false,
    errors,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

export default app;