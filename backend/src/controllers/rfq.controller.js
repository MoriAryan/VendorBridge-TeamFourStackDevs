import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { RFQ } from "../models/rfq.model.js";
import { ActivityLog } from "../models/activityLog.model.js";

// =====================================================================
// Helper: Log activity (fire-and-forget style — don't block response)
// =====================================================================
const logActivity = async (action, entityId, performedBy, details = {}) => {
  try {
    await ActivityLog.create({
      action,
      entityType: "RFQ",
      entityId,
      performedBy,
      details,
    });
  } catch (err) {
    // Activity logging failure should never block the main flow
    console.error("Activity log error:", err.message);
  }
};

// =====================================================================
// CREATE RFQ
// POST /api/v1/rfqs
// Role: procurement_officer, admin
// =====================================================================
const createRFQ = asyncHandler(async (req, res) => {
  const {
    title,
    category,
    deadline,
    description,
    lineItems,
    assignedVendors,
    attachments,
    sendToVendors, // boolean — true = Open, false = Draft
  } = req.body;

  // Validate required fields immediately (early return pattern)
  if (!title?.trim()) {
    throw new ApiError(400, "RFQ title is required");
  }
  if (!deadline) {
    throw new ApiError(400, "Deadline is required");
  }
  if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
    throw new ApiError(400, "At least one line item is required");
  }

  // Validate deadline is in the future
  if (new Date(deadline) <= new Date()) {
    throw new ApiError(400, "Deadline must be a future date");
  }

  const status = sendToVendors ? "Open" : "Draft";

  const rfq = await RFQ.create({
    title: title.trim(),
    category: category?.trim(),
    deadline: new Date(deadline),
    description: description?.trim(),
    lineItems,
    assignedVendors: assignedVendors || [],
    attachments: attachments || [],
    status,
    createdBy: req.user._id,
  });

  // Activity tracking — Rule 7
  const vendorCount = assignedVendors?.length || 0;
  await logActivity(
    status === "Open"
      ? `RFQ "${rfq.title}" created and sent to ${vendorCount} vendor(s)`
      : `RFQ "${rfq.title}" saved as Draft`,
    rfq._id,
    req.user._id,
    { title: rfq.title, status, rfqNumber: rfq.rfqNumber, vendorCount }
  );

  return res
    .status(201)
    .json(new ApiResponse(201, rfq, `RFQ ${status === "Open" ? "sent to vendors" : "saved as Draft"} successfully`));
});

// =====================================================================
// GET ALL RFQs
// GET /api/v1/rfqs?status=Open&search=furniture&page=1&limit=10
// Role: procurement_officer, admin (vendor sees only their assigned RFQs)
// =====================================================================
const getAllRFQs = asyncHandler(async (req, res) => {
  const {
    status,
    search,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  // Build match stage based on role
  const matchStage = {};

  // Vendors only see RFQs they are assigned to
  if (req.user.role === "vendor") {
    matchStage.assignedVendors = req.user._id;
    matchStage.status = "Open"; // Vendors only see open RFQs
  } else if (status && status !== "All") {
    matchStage.status = status;
  }

  // Text search — uses compound text index on title + category
  if (search?.trim()) {
    matchStage.$text = { $search: search.trim() };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortDir = sortOrder === "asc" ? 1 : -1;

  // Use aggregation for relational data (Rule: prefer $lookup over .populate())
  const pipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: "users",
        localField: "createdBy",
        foreignField: "_id",
        as: "createdByUser",
        pipeline: [{ $project: { name: 1, email: 1, role: 1 } }],
      },
    },
    { $unwind: { path: "$createdByUser", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "users",
        localField: "assignedVendors",
        foreignField: "_id",
        as: "vendorDetails",
        pipeline: [{ $project: { name: 1, email: 1, companyName: 1 } }],
      },
    },
    {
      $project: {
        title: 1,
        rfqNumber: 1,
        category: 1,
        deadline: 1,
        status: 1,
        lineItems: 1,
        createdAt: 1,
        createdByUser: 1,
        vendorCount: { $size: "$assignedVendors" },
        vendorDetails: 1,
        lineItemCount: { $size: "$lineItems" },
      },
    },
    { $sort: { [sortBy]: sortDir } },
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: parseInt(limit) }],
        totalCount: [{ $count: "count" }],
      },
    },
  ];

  const result = await RFQ.aggregate(pipeline);
  const rfqs = result[0]?.data || [];
  const total = result[0]?.totalCount[0]?.count || 0;

  return res.status(200).json(
    new ApiResponse(200, {
      rfqs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    }, "RFQs fetched successfully")
  );
});

// =====================================================================
// GET SINGLE RFQ BY ID
// GET /api/v1/rfqs/:id
// =====================================================================
const getRFQById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const pipeline = [
    {
      $match: {
        _id: new (await import("mongoose")).default.Types.ObjectId(id),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "createdBy",
        foreignField: "_id",
        as: "createdByUser",
        pipeline: [{ $project: { name: 1, email: 1, role: 1 } }],
      },
    },
    { $unwind: { path: "$createdByUser", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "users",
        localField: "assignedVendors",
        foreignField: "_id",
        as: "vendorDetails",
        pipeline: [
          { $project: { name: 1, email: 1, companyName: 1, gstNumber: 1, phone: 1 } },
        ],
      },
    },
  ];

  const result = await RFQ.aggregate(pipeline);
  const rfq = result[0];

  if (!rfq) {
    throw new ApiError(404, "RFQ not found");
  }

  // Vendors can only view RFQs they are assigned to (Role enforcement - Rule 9)
  if (req.user.role === "vendor") {
    const isAssigned = rfq.assignedVendors?.some(
      (v) => v.toString() === req.user._id.toString()
    );
    if (!isAssigned) {
      throw new ApiError(403, "You are not assigned to this RFQ");
    }
  }

  return res.status(200).json(new ApiResponse(200, rfq, "RFQ fetched successfully"));
});

// =====================================================================
// UPDATE RFQ
// PATCH /api/v1/rfqs/:id
// Only allowed when status is "Draft"
// =====================================================================
const updateRFQ = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const rfq = await RFQ.findById(id);
  if (!rfq) {
    throw new ApiError(404, "RFQ not found");
  }

  // Only creator or admin can update
  if (
    rfq.createdBy.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    throw new ApiError(403, "You are not authorized to update this RFQ");
  }

  // Can only edit Draft RFQs
  if (rfq.status !== "Draft") {
    throw new ApiError(
      400,
      `Cannot edit an RFQ with status "${rfq.status}". Only Draft RFQs can be modified.`
    );
  }

  const allowedUpdates = [
    "title",
    "category",
    "deadline",
    "description",
    "lineItems",
    "assignedVendors",
    "attachments",
  ];

  const updates = {};
  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  // Handle status change — "sendToVendors" flag promotes Draft → Open
  if (req.body.sendToVendors === true) {
    updates.status = "Open";
  }

  const updatedRFQ = await RFQ.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });

  await logActivity(
    updates.status === "Open"
      ? `RFQ "${updatedRFQ.title}" published and sent to vendors`
      : `RFQ "${updatedRFQ.title}" updated`,
    updatedRFQ._id,
    req.user._id,
    { changes: Object.keys(updates), status: updatedRFQ.status }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedRFQ, "RFQ updated successfully"));
});

// =====================================================================
// DELETE RFQ (soft cancel — set status to Expired)
// DELETE /api/v1/rfqs/:id
// Only Draft RFQs can be cancelled; Open RFQs must go through a workflow
// =====================================================================
const deleteRFQ = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const rfq = await RFQ.findById(id);
  if (!rfq) {
    throw new ApiError(404, "RFQ not found");
  }

  if (
    rfq.createdBy.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    throw new ApiError(403, "You are not authorized to cancel this RFQ");
  }

  if (!["Draft", "Open"].includes(rfq.status)) {
    throw new ApiError(400, `Cannot cancel an RFQ with status "${rfq.status}"`);
  }

  rfq.status = "Expired";
  await rfq.save();

  await logActivity(
    `RFQ "${rfq.title}" cancelled`,
    rfq._id,
    req.user._id,
    { previousStatus: rfq.status }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, { rfqNumber: rfq.rfqNumber }, "RFQ cancelled successfully"));
});

// =====================================================================
// GET RFQ STATS (for dashboard KPIs)
// GET /api/v1/rfqs/stats
// =====================================================================
const getRFQStats = asyncHandler(async (req, res) => {
  const matchStage =
    req.user.role === "vendor"
      ? { assignedVendors: req.user._id }
      : {};

  const stats = await RFQ.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const result = { Draft: 0, Open: 0, Closed: 0, Expired: 0, total: 0 };
  stats.forEach(({ _id, count }) => {
    result[_id] = count;
    result.total += count;
  });

  return res.status(200).json(new ApiResponse(200, result, "RFQ stats fetched"));
});

export {
  createRFQ,
  getAllRFQs,
  getRFQById,
  updateRFQ,
  deleteRFQ,
  getRFQStats,
};
