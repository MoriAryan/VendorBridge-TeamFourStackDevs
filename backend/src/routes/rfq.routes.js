import { Router } from "express";
import {
  createRFQ,
  getAllRFQs,
  getRFQById,
  updateRFQ,
  deleteRFQ,
  getRFQStats,
} from "../controllers/rfq.controller.js";
import { verifyJWT, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

// All RFQ routes require authentication
router.use(verifyJWT);

// ============================================================
// Stats route — must be before /:id to avoid ID param conflict
// GET /api/v1/rfqs/stats
// ============================================================
router.route("/stats").get(getRFQStats);

// ============================================================
// Collection routes
// GET  /api/v1/rfqs       — list all RFQs (role-filtered)
// POST /api/v1/rfqs       — create new RFQ (officer/admin only)
// ============================================================
router
  .route("/")
  .get(getAllRFQs)
  .post(requireRole("procurement_officer", "admin"), createRFQ);

// ============================================================
// Document routes
// GET    /api/v1/rfqs/:id  — get single RFQ
// PATCH  /api/v1/rfqs/:id  — update RFQ (Draft only)
// DELETE /api/v1/rfqs/:id  — cancel RFQ (officer/admin only)
// ============================================================
router
  .route("/:id")
  .get(getRFQById)
  .patch(requireRole("procurement_officer", "admin"), updateRFQ)
  .delete(requireRole("procurement_officer", "admin"), deleteRFQ);

export default router;
