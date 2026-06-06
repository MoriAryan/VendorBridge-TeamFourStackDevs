import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';

// Routes
import approvalRoutes       from './routes/approval.routes.js';
import purchaseOrderRoutes  from './routes/purchaseOrder.routes.js';
import invoiceRoutes        from './routes/invoice.routes.js';
import { seedData }         from './controllers/seed.controller.js';
import { getAnalyticsSummary } from './controllers/analytics.controller.js';

const app = express();

// ── CORS ──────────────────────────────────────────────────────
const frontendOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.CORS_ORIGIN,
].filter(Boolean);

app.use(cors({ origin: frontendOrigins, credentials: true }));

// ── Body Parsers ──────────────────────────────────────────────
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(cookieParser());
app.use(express.static('public'));

// ── Health ────────────────────────────────────────────────────
app.get('/api/v1/health', (req, res) => {
  const stateMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.status(200).json({
    service: 'VendorBridge',
    api:     'healthy',
    db:      stateMap[mongoose.connection.readyState] || 'unknown',
  });
});

// ── Seed (dev only) ───────────────────────────────────────────
app.get('/api/v1/seed', seedData);

// ── API Routes ────────────────────────────────────────────────
app.use('/api/v1/approvals',       approvalRoutes);
app.use('/api/v1/purchase-orders', purchaseOrderRoutes);
app.use('/api/v1/invoices',        invoiceRoutes);

// ── Analytics (read-only aggregation) ────────────────────────
app.get('/api/v1/analytics/summary', getAnalyticsSummary);

// ============================================
// Feature Routes
// ============================================
import activityLogRouter from "./routes/activityLog.routes.js";
app.use("/api/v1/activity-logs", activityLogRouter);

// ============================================
// 404 Handler
// ============================================
app.use((req, res) => {
  res.status(404).json({ statusCode: 404, message: 'Route not found', success: false });
});

export default app;