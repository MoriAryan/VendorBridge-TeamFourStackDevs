import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";

// ── Routes (must be at the top with all other imports in ESM) ──────────
import authRouter       from "./routes/auth.routes.js";
import rfqRouter        from "./routes/rfq.routes.js";
import vendorRouter     from "./routes/vendor.routes.js";
import quotationRouter  from "./routes/quotation.routes.js";
import approvalRouter   from "./routes/approval.routes.js";

const app = express();

// ============================================
// CORS Configuration for Frontend Connection
// ============================================
const frontendOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.CORS_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin: frontendOrigins,
    credentials: true,
  })
);

// ============================================
// Body Parsers
// ============================================
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(express.static("public"));

// ============================================
// Landing Route
// ============================================
app.get("/", (req, res) => {
  res.status(200).json({
    message: "VendorBridge backend is running",
    status: "OK",
  });
});

// ============================================
// Health Route
// ============================================
app.get("/api/v1/health", (req, res) => {
  const connectionState = mongoose.connection.readyState;
  const stateMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  res.status(200).json({
    service: "VendorBridge",
    api: "healthy",
    db: stateMap[connectionState] || "unknown",
  });
});

// ============================================
// API Routes — versioned at /api/v1/
// ============================================
app.use("/api/v1/auth",        authRouter);
app.use("/api/v1/rfqs",        rfqRouter);
app.use("/api/v1/vendors",     vendorRouter);
app.use("/api/v1/quotations",  quotationRouter);
app.use("/api/v1/approvals",   approvalRouter);

// ============================================
// 404 Handler
// ============================================
app.use((req, res) => {
  res.status(404).json({
    statusCode: 404,
    message: "Route not found",
    success: false,
  });
});

// ============================================
// Global Error Handler
// Catches ApiError instances and unhandled errors
// ============================================
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