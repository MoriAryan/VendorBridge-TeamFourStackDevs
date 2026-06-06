import { Router } from "express";
import {
  createApproval,
  getAllApprovals,
  getApprovalById,
  decideApproval,
  getApprovalByQuotation,
} from "../controllers/approval.controller.js";
import { verifyJWT, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT);

// GET /api/v1/approvals/by-quotation/:quotationId — must be before /:id
router
  .route("/by-quotation/:quotationId")
  .get(getApprovalByQuotation);

// GET /api/v1/approvals          — list all
// POST /api/v1/approvals         — create approval request (officer/admin)
router
  .route("/")
  .get(getAllApprovals)
  .post(requireRole("procurement_officer", "admin"), createApproval);

// GET   /api/v1/approvals/:id          — single approval detail
// PATCH /api/v1/approvals/:id/decide   — approve or reject a level
router.route("/:id").get(getApprovalById);

router
  .route("/:id/decide")
  .patch(requireRole("admin", "approver", "procurement_officer"), decideApproval);

export default router;
