import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";

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
// 404 Handler
// ============================================
app.use((req, res) => {
  res.status(404).json({
    statusCode: 404,
    message: "Route not found",
    success: false,
  });
});

export default app;