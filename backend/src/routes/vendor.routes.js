import { Router } from "express";
import {
  getAllVendors,
  getVendorById,
  createVendor,
  updateVendorStatus,
  updateVendor,
  getActiveVendors,
} from "../controllers/vendor.controller.js";
import { verifyJWT, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

// All vendor routes require authentication — Rule 9: enforce role permissions
router.use(verifyJWT);

// ── Active vendors for dropdowns (RFQ assignment) ────────────────────
// GET /api/v1/vendors/active
router.route("/active").get(getActiveVendors);

// ── Collection routes ────────────────────────────────────────────────
// GET  /api/v1/vendors        — list all vendors (officer/admin/approver)
// POST /api/v1/vendors        — create vendor (officer/admin only)
router
  .route("/")
  .get(getAllVendors)
  .post(requireRole("procurement_officer", "admin"), createVendor);

// ── Document routes ──────────────────────────────────────────────────
// GET   /api/v1/vendors/:id          — get single vendor profile
// PATCH /api/v1/vendors/:id          — update vendor profile (officer/admin)
router
  .route("/:id")
  .get(getVendorById)
  .patch(requireRole("procurement_officer", "admin"), updateVendor);

// ── Status management ────────────────────────────────────────────────
// PATCH /api/v1/vendors/:id/status   — toggle Active/Inactive/Blocked (admin only)
router
  .route("/:id/status")
  .patch(requireRole("admin", "procurement_officer"), updateVendorStatus);

export default router;
