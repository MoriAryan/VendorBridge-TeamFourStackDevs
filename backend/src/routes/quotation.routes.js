import { Router } from "express";
import {
  submitQuotation,
  getQuotationsByRFQ,
  getQuotationById,
  compareQuotations,
  selectQuotation,
  getQuotationCount,
} from "../controllers/quotation.controller.js";
import { verifyJWT, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

// All quotation routes require authentication — Rule 9
router.use(verifyJWT);

// ── Special routes — must come before /:id ──────────────────────────
// GET /api/v1/quotations/compare?rfqId=xxx  — comparison matrix (officer/admin)
router
  .route("/compare")
  .get(requireRole("procurement_officer", "admin"), compareQuotations);

// GET /api/v1/quotations/count?rfqId=xxx   — lightweight count
router.route("/count").get(getQuotationCount);

// ── Collection routes ────────────────────────────────────────────────
// GET  /api/v1/quotations?rfqId=xxx  — list quotations for an RFQ
// POST /api/v1/quotations            — submit a quotation (vendor)
router
  .route("/")
  .get(getQuotationsByRFQ)
  .post(requireRole("vendor", "procurement_officer", "admin"), submitQuotation);

// ── Document routes ──────────────────────────────────────────────────
// GET   /api/v1/quotations/:id           — get single quotation
// PATCH /api/v1/quotations/:id/select    — select winning quotation (officer/admin)
router.route("/:id").get(getQuotationById);

router
  .route("/:id/select")
  .patch(requireRole("procurement_officer", "admin"), selectQuotation);

export default router;
