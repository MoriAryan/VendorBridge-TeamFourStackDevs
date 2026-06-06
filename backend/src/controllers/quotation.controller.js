import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Quotation } from "../models/quotation.model.js";
import { RFQ } from "../models/rfq.model.js";
import { ActivityLog } from "../models/activityLog.model.js";
import mongoose from "mongoose";

// =====================================================================
// SUBMIT / UPSERT QUOTATION
// POST /api/v1/quotations
// Role: vendor (can only submit for their own assigned RFQs)
//       procurement_officer / admin can create on behalf of vendor
// =====================================================================
const submitQuotation = asyncHandler(async (req, res) => {
  const {
    rfqId,
    lineItems,
    taxPercent = 0,
    validUntil,
    deliveryDays,
    paymentTerms,
    notes,
    currency = "INR",
  } = req.body;

  if (!rfqId) throw new ApiError(400, "rfqId is required");
  if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
    throw new ApiError(400, "At least one line item is required");
  }
  if (!mongoose.Types.ObjectId.isValid(rfqId)) {
    throw new ApiError(400, "Invalid RFQ ID");
  }

  // Validate the RFQ exists and is Open
  const rfq = await RFQ.findById(rfqId);
  if (!rfq) throw new ApiError(404, "RFQ not found");
  if (rfq.status !== "Open") {
    throw new ApiError(400, `Cannot submit quotation — RFQ is ${rfq.status}`);
  }

  // Vendors can only quote for RFQs they are assigned to
  const vendorId =
    req.user.role === "vendor" ? req.user._id : req.body.vendorId;

  if (!vendorId) throw new ApiError(400, "vendorId is required");

  if (req.user.role === "vendor") {
    const isAssigned = rfq.assignedVendors.some(
      (v) => v.toString() === req.user._id.toString()
    );
    if (!isAssigned) {
      throw new ApiError(403, "You are not assigned to this RFQ");
    }
  }

  // Build line items with totals
  const builtItems = lineItems.map((li) => ({
    rfqLineItemId: li.rfqLineItemId || li._id,
    itemName: li.itemName || li.item,
    quantity: Number(li.quantity || li.qty),
    unit: li.unit || "NOS",
    unitPrice: Number(li.unitPrice),
    notes: li.notes || "",
  }));

  // Upsert — vendor can update their quotation until deadline
  let quotation = await Quotation.findOne({ rfq: rfqId, vendor: vendorId });

  if (quotation) {
    // Update existing
    quotation.lineItems = builtItems;
    quotation.taxPercent = Number(taxPercent);
    quotation.validUntil = validUntil ? new Date(validUntil) : quotation.validUntil;
    quotation.deliveryDays = deliveryDays !== undefined ? Number(deliveryDays) : quotation.deliveryDays;
    quotation.paymentTerms = paymentTerms || quotation.paymentTerms;
    quotation.notes = notes || quotation.notes;
    quotation.currency = currency;
    quotation.status = "Submitted";
    await quotation.save();
  } else {
    // Create new
    quotation = await Quotation.create({
      rfq: rfqId,
      vendor: vendorId,
      lineItems: builtItems,
      taxPercent: Number(taxPercent),
      validUntil: validUntil ? new Date(validUntil) : undefined,
      deliveryDays: deliveryDays !== undefined ? Number(deliveryDays) : undefined,
      paymentTerms,
      notes,
      currency,
      status: "Submitted",
    });
  }

  // Activity log — Rule 7
  await ActivityLog.create({
    action: `Quotation submitted for RFQ ${rfq.rfqNumber} by vendor`,
    entityType: "Quotation",
    entityId: quotation._id,
    performedBy: req.user._id,
    details: { rfqId, totalAmount: quotation.totalAmount },
  }).catch(() => {});

  return res
    .status(201)
    .json(new ApiResponse(201, quotation, "Quotation submitted successfully"));
});

// =====================================================================
// GET ALL QUOTATIONS FOR AN RFQ
// GET /api/v1/quotations?rfqId=xxx
// Role: procurement_officer, admin can see all; vendor sees only own
// =====================================================================
const getQuotationsByRFQ = asyncHandler(async (req, res) => {
  const { rfqId } = req.query;

  if (!rfqId) throw new ApiError(400, "rfqId query param is required");
  if (!mongoose.Types.ObjectId.isValid(rfqId)) {
    throw new ApiError(400, "Invalid RFQ ID");
  }

  const matchStage = { rfq: new mongoose.Types.ObjectId(rfqId) };

  // Vendors only see their own quotation
  if (req.user.role === "vendor") {
    matchStage.vendor = req.user._id;
  }

  const pipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: "users",
        localField: "vendor",
        foreignField: "_id",
        as: "vendorInfo",
        pipeline: [
          { $project: { name: 1, email: 1, companyName: 1, vendorCategory: 1, gstNumber: 1, phone: 1 } },
        ],
      },
    },
    { $unwind: { path: "$vendorInfo", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "rfqs",
        localField: "rfq",
        foreignField: "_id",
        as: "rfqInfo",
        pipeline: [{ $project: { title: 1, rfqNumber: 1, deadline: 1, status: 1, lineItems: 1 } }],
      },
    },
    { $unwind: { path: "$rfqInfo", preserveNullAndEmptyArrays: true } },
    { $sort: { totalAmount: 1 } }, // Cheapest first — helps comparison
  ];

  const quotations = await Quotation.aggregate(pipeline);

  // Attach rank (cheapest = rank 1) based on totalAmount
  quotations.forEach((q, i) => {
    q.rank = i + 1;
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { quotations, total: quotations.length }, "Quotations fetched successfully"));
});

// =====================================================================
// GET SINGLE QUOTATION
// GET /api/v1/quotations/:id
// =====================================================================
const getQuotationById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid quotation ID");
  }

  const pipeline = [
    { $match: { _id: new mongoose.Types.ObjectId(id) } },
    {
      $lookup: {
        from: "users",
        localField: "vendor",
        foreignField: "_id",
        as: "vendorInfo",
        pipeline: [{ $project: { name: 1, email: 1, companyName: 1, vendorCategory: 1, gstNumber: 1, phone: 1 } }],
      },
    },
    { $unwind: { path: "$vendorInfo", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "rfqs",
        localField: "rfq",
        foreignField: "_id",
        as: "rfqInfo",
        pipeline: [{ $project: { title: 1, rfqNumber: 1, deadline: 1, status: 1 } }],
      },
    },
    { $unwind: { path: "$rfqInfo", preserveNullAndEmptyArrays: true } },
  ];

  const result = await Quotation.aggregate(pipeline);
  const quotation = result[0];

  if (!quotation) throw new ApiError(404, "Quotation not found");

  // Vendors can only see their own quotation
  if (req.user.role === "vendor" && quotation.vendor.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Access denied");
  }

  return res.status(200).json(new ApiResponse(200, quotation, "Quotation fetched successfully"));
});

// =====================================================================
// GET QUOTATION COMPARISON FOR AN RFQ
// GET /api/v1/quotations/compare?rfqId=xxx
// Role: procurement_officer, admin
// Returns all quotations side-by-side with item-level price comparison
// =====================================================================
const compareQuotations = asyncHandler(async (req, res) => {
  const { rfqId } = req.query;

  if (!rfqId) throw new ApiError(400, "rfqId is required");
  if (!mongoose.Types.ObjectId.isValid(rfqId)) {
    throw new ApiError(400, "Invalid RFQ ID");
  }

  // Only officers/admins can compare
  if (req.user.role === "vendor") {
    throw new ApiError(403, "Vendors cannot access comparison data");
  }

  const rfq = await RFQ.findById(rfqId).lean();
  if (!rfq) throw new ApiError(404, "RFQ not found");

  const pipeline = [
    {
      $match: {
        rfq: new mongoose.Types.ObjectId(rfqId),
        status: { $in: ["Submitted", "Accepted", "Rejected"] },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "vendor",
        foreignField: "_id",
        as: "vendorInfo",
        pipeline: [{ $project: { name: 1, email: 1, companyName: 1, vendorCategory: 1, gstNumber: 1 } }],
      },
    },
    { $unwind: { path: "$vendorInfo", preserveNullAndEmptyArrays: true } },
    { $sort: { totalAmount: 1 } },
  ];

  const quotations = await Quotation.aggregate(pipeline);

  // Build comparison matrix — each RFQ line item vs all vendor prices
  const rfqLineItems = rfq.lineItems || [];
  const comparisonMatrix = rfqLineItems.map((rfqItem) => {
    const itemName = rfqItem.item || rfqItem.itemName;
    const vendorPrices = quotations.map((q) => {
      const matching = q.lineItems.find(
        (li) =>
          li.rfqLineItemId?.toString() === rfqItem._id?.toString() ||
          li.itemName?.toLowerCase() === itemName?.toLowerCase()
      );
      return {
        vendorId: q.vendor,
        vendorName: q.vendorInfo?.companyName || q.vendorInfo?.name || "Unknown",
        quotationId: q._id,
        unitPrice: matching?.unitPrice ?? null,
        totalPrice: matching?.totalPrice ?? null,
        notes: matching?.notes || "",
      };
    });

    // Mark cheapest price in this row
    const validPrices = vendorPrices.filter((v) => v.unitPrice !== null);
    const minPrice = validPrices.length > 0 ? Math.min(...validPrices.map((v) => v.unitPrice)) : null;

    return {
      itemName,
      quantity: rfqItem.qty || rfqItem.quantity,
      unit: rfqItem.unit,
      vendorPrices: vendorPrices.map((v) => ({
        ...v,
        isCheapest: v.unitPrice !== null && v.unitPrice === minPrice,
      })),
    };
  });

  // Summary per quotation
  const summary = quotations.map((q, i) => ({
    rank: i + 1,
    quotationId: q._id,
    quotationNumber: q.quotationNumber,
    vendorId: q.vendor,
    vendorName: q.vendorInfo?.companyName || q.vendorInfo?.name,
    vendorEmail: q.vendorInfo?.email,
    vendorCategory: q.vendorInfo?.vendorCategory,
    subtotal: q.subtotal,
    taxPercent: q.taxPercent,
    taxAmount: q.taxAmount,
    totalAmount: q.totalAmount,
    deliveryDays: q.deliveryDays,
    paymentTerms: q.paymentTerms,
    notes: q.notes,
    status: q.status,
    submittedAt: q.updatedAt,
    isCheapest: i === 0, // Already sorted cheapest first
  }));

  return res.status(200).json(
    new ApiResponse(
      200,
      { rfq, comparisonMatrix, summary, total: quotations.length },
      "Quotation comparison ready"
    )
  );
});

// =====================================================================
// SELECT WINNING QUOTATION
// PATCH /api/v1/quotations/:id/select
// Role: procurement_officer, admin
// =====================================================================
const selectQuotation = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid quotation ID");
  }

  const quotation = await Quotation.findById(id);
  if (!quotation) throw new ApiError(404, "Quotation not found");

  // Mark this quotation as Accepted, reject all others for same RFQ
  await Quotation.updateMany(
    { rfq: quotation.rfq, _id: { $ne: quotation._id } },
    { status: "Rejected" }
  );

  quotation.status = "Accepted";
  quotation.selectedAt = new Date();
  quotation.selectedBy = req.user._id;
  await quotation.save();

  // Close the RFQ
  await RFQ.findByIdAndUpdate(quotation.rfq, { status: "Closed" });

  // Activity log — Rule 7
  await ActivityLog.create({
    action: `Quotation ${quotation.quotationNumber} selected as winner — RFQ closed`,
    entityType: "Quotation",
    entityId: quotation._id,
    performedBy: req.user._id,
  }).catch(() => {});

  return res
    .status(200)
    .json(new ApiResponse(200, quotation, "Quotation accepted — RFQ closed"));
});

// =====================================================================
// GET QUOTATION COUNT FOR AN RFQ (lightweight — for RFQ detail badge)
// GET /api/v1/quotations/count?rfqId=xxx
// =====================================================================
const getQuotationCount = asyncHandler(async (req, res) => {
  const { rfqId } = req.query;
  if (!rfqId || !mongoose.Types.ObjectId.isValid(rfqId)) {
    return res.status(200).json(new ApiResponse(200, { count: 0 }, "OK"));
  }
  const count = await Quotation.countDocuments({
    rfq: rfqId,
    status: { $in: ["Submitted", "Accepted", "Rejected"] },
  });
  return res.status(200).json(new ApiResponse(200, { count }, "Quotation count fetched"));
});

export {
  submitQuotation,
  getQuotationsByRFQ,
  getQuotationById,
  compareQuotations,
  selectQuotation,
  getQuotationCount,
};
