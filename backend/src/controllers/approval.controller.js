import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Approval } from "../models/approval.model.js";
import { Quotation } from "../models/quotation.model.js";
import { RFQ } from "../models/rfq.model.js";
import { ActivityLog } from "../models/activityLog.model.js";
import mongoose from "mongoose";

// =====================================================================
// CREATE APPROVAL REQUEST
// POST /api/v1/approvals
// Role: procurement_officer, admin
// Creates a 2-level approval chain automatically
// =====================================================================
const createApproval = asyncHandler(async (req, res) => {
  const { quotationId, remarks } = req.body;

  if (!quotationId || !mongoose.Types.ObjectId.isValid(quotationId)) {
    throw new ApiError(400, "Valid quotationId is required");
  }

  // Validate quotation is Accepted (winner selected)
  const quotation = await Quotation.findById(quotationId)
    .populate("rfq", "rfqNumber title status")
    .populate("vendor", "name companyName email");

  if (!quotation) throw new ApiError(404, "Quotation not found");
  if (quotation.status !== "Accepted") {
    throw new ApiError(400, "Only an accepted (winning) quotation can be sent for approval");
  }

  // Check if approval already exists for this quotation
  const existing = await Approval.findOne({ quotation: quotationId });
  if (existing) {
    throw new ApiError(409, "An approval request already exists for this quotation");
  }

  // Build 2-level chain — in a real system these would be fetched from org chart
  // For now, first admin/approver in system acts as both levels
  const approvalChain = [
    {
      level: 1,
      label: "L1 – Procurement Head Review",
      status: "Pending",
    },
    {
      level: 2,
      label: "L2 – Finance Manager Approval",
      status: "Pending",
    },
  ];

  const approval = await Approval.create({
    quotation: quotationId,
    rfq: quotation.rfq._id,
    requestedBy: req.user._id,
    approvalChain,
    status: "Pending",
    snapshot: {
      vendorName: quotation.vendor?.companyName || quotation.vendor?.name,
      rfqNumber: quotation.rfq.rfqNumber,
      rfqTitle: quotation.rfq.title,
      totalAmount: quotation.totalAmount,
      currency: quotation.currency || "INR",
    },
  });

  await ActivityLog.create({
    action: `Approval request created for quotation ${quotation.quotationNumber}`,
    entityType: "Approval",
    entityId: approval._id,
    performedBy: req.user._id,
  }).catch(() => {});

  return res
    .status(201)
    .json(new ApiResponse(201, approval, "Approval request created successfully"));
});

// =====================================================================
// GET ALL APPROVALS
// GET /api/v1/approvals?status=Pending&page=1&limit=20
// Role: admin, procurement_officer, approver
// =====================================================================
const getAllApprovals = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const match = {};
  if (status && status !== "All") match.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const pipeline = [
    { $match: match },
    {
      $lookup: {
        from: "quotations",
        localField: "quotation",
        foreignField: "_id",
        as: "quotationInfo",
        pipeline: [
          {
            $project: {
              quotationNumber: 1, totalAmount: 1, taxPercent: 1,
              status: 1, currency: 1, lineItems: 1,
            },
          },
        ],
      },
    },
    { $unwind: { path: "$quotationInfo", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "rfqs",
        localField: "rfq",
        foreignField: "_id",
        as: "rfqInfo",
        pipeline: [{ $project: { rfqNumber: 1, title: 1, category: 1, deadline: 1 } }],
      },
    },
    { $unwind: { path: "$rfqInfo", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "users",
        localField: "requestedBy",
        foreignField: "_id",
        as: "requestedByUser",
        pipeline: [{ $project: { name: 1, email: 1, role: 1 } }],
      },
    },
    { $unwind: { path: "$requestedByUser", preserveNullAndEmptyArrays: true } },
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: parseInt(limit) }],
        totalCount: [{ $count: "count" }],
        stats: [
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ],
      },
    },
  ];

  const result = await Approval.aggregate(pipeline);
  const approvals = result[0]?.data || [];
  const total = result[0]?.totalCount[0]?.count || 0;

  // Build stats object
  const statsRaw = result[0]?.stats || [];
  const stats = { Pending: 0, Approved: 0, Rejected: 0 };
  statsRaw.forEach((s) => { stats[s._id] = s.count; });

  return res.status(200).json(
    new ApiResponse(200, {
      approvals,
      stats,
      pagination: {
        total, page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    }, "Approvals fetched successfully")
  );
});

// =====================================================================
// GET SINGLE APPROVAL
// GET /api/v1/approvals/:id
// =====================================================================
const getApprovalById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid approval ID");

  const pipeline = [
    { $match: { _id: new mongoose.Types.ObjectId(id) } },
    {
      $lookup: {
        from: "quotations",
        localField: "quotation",
        foreignField: "_id",
        as: "quotationInfo",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "vendor",
              foreignField: "_id",
              as: "vendorInfo",
              pipeline: [{ $project: { name: 1, email: 1, companyName: 1, gstNumber: 1, phone: 1 } }],
            },
          },
          { $unwind: { path: "$vendorInfo", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              quotationNumber: 1, lineItems: 1, totalAmount: 1,
              subtotal: 1, taxPercent: 1, taxAmount: 1,
              deliveryDays: 1, paymentTerms: 1, notes: 1,
              currency: 1, status: 1, vendorInfo: 1,
            },
          },
        ],
      },
    },
    { $unwind: { path: "$quotationInfo", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "rfqs",
        localField: "rfq",
        foreignField: "_id",
        as: "rfqInfo",
        pipeline: [{ $project: { rfqNumber: 1, title: 1, category: 1, deadline: 1, lineItems: 1 } }],
      },
    },
    { $unwind: { path: "$rfqInfo", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "users",
        localField: "requestedBy",
        foreignField: "_id",
        as: "requestedByUser",
        pipeline: [{ $project: { name: 1, email: 1, role: 1 } }],
      },
    },
    { $unwind: { path: "$requestedByUser", preserveNullAndEmptyArrays: true } },
  ];

  const result = await Approval.aggregate(pipeline);
  const approval = result[0];
  if (!approval) throw new ApiError(404, "Approval not found");

  return res.status(200).json(new ApiResponse(200, approval, "Approval fetched successfully"));
});

// =====================================================================
// APPROVE / REJECT A LEVEL IN THE CHAIN
// PATCH /api/v1/approvals/:id/decide
// Role: admin, approver (manager)
// Body: { level: 1, decision: "Approved" | "Rejected", remarks: "..." }
// =====================================================================
const decideApproval = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { level, decision, remarks } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid approval ID");
  if (!["Approved", "Rejected"].includes(decision)) {
    throw new ApiError(400, "Decision must be 'Approved' or 'Rejected'");
  }
  if (!level || isNaN(level)) throw new ApiError(400, "level is required");

  const approval = await Approval.findById(id);
  if (!approval) throw new ApiError(404, "Approval not found");
  if (approval.status !== "Pending") {
    throw new ApiError(400, `Approval is already ${approval.status}`);
  }

  // Find the chain step
  const step = approval.approvalChain.find((s) => s.level === parseInt(level));
  if (!step) throw new ApiError(404, `No approval step at level ${level}`);
  if (step.status !== "Pending") {
    throw new ApiError(400, `Level ${level} is already ${step.status}`);
  }

  // Check level ordering — level 2 can only be decided after level 1 is Approved
  if (parseInt(level) > 1) {
    const prevStep = approval.approvalChain.find((s) => s.level === parseInt(level) - 1);
    if (prevStep && prevStep.status !== "Approved") {
      throw new ApiError(400, `Level ${parseInt(level) - 1} must be approved first`);
    }
  }

  // Apply decision
  step.status = decision;
  step.remarks = remarks || "";
  step.decidedAt = new Date();
  step.approverName = req.user.name || "Unknown";
  step.approver = req.user._id;

  // Determine overall status
  if (decision === "Rejected") {
    approval.status = "Rejected";
    approval.rejectionReason = remarks || "";
    approval.finalizedAt = new Date();
  } else {
    // Check if all levels approved
    const allApproved = approval.approvalChain.every((s) => s.status === "Approved");
    if (allApproved) {
      approval.status = "Approved";
      approval.finalizedAt = new Date();
    }
  }

  await approval.save();

  // Activity log
  await ActivityLog.create({
    action: `Approval L${level} ${decision} for ${approval.snapshot?.rfqNumber}`,
    entityType: "Approval",
    entityId: approval._id,
    performedBy: req.user._id,
    details: { level, decision, remarks },
  }).catch(() => {});

  return res
    .status(200)
    .json(new ApiResponse(200, approval, `Level ${level} ${decision} successfully`));
});

// =====================================================================
// GET APPROVAL FOR A SPECIFIC QUOTATION
// GET /api/v1/approvals/by-quotation/:quotationId
// =====================================================================
const getApprovalByQuotation = asyncHandler(async (req, res) => {
  const { quotationId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(quotationId)) {
    throw new ApiError(400, "Invalid quotation ID");
  }

  const approval = await Approval.findOne({ quotation: quotationId }).lean();
  return res
    .status(200)
    .json(new ApiResponse(200, approval || null, "OK"));
});

export {
  createApproval,
  getAllApprovals,
  getApprovalById,
  decideApproval,
  getApprovalByQuotation,
};
