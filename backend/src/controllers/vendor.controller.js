import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { ActivityLog } from "../models/activityLog.model.js";
import mongoose from "mongoose";

// =====================================================================
// GET ALL VENDORS
// GET /api/v1/vendors?status=Active&search=infra&page=1&limit=10
// Role: admin, procurement_officer, approver
// =====================================================================
const getAllVendors = asyncHandler(async (req, res) => {
  const {
    status,
    search,
    category,
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  // Build match stage — vendors are Users with role === "vendor"
  const matchStage = { role: "vendor" };

  if (status && status !== "All") {
    matchStage.isActive = status === "Active";
    // Blocked is tracked via a separate field — see note below
    if (status === "Blocked") {
      matchStage.isBlocked = true;
      delete matchStage.isActive;
    } else if (status === "Inactive") {
      matchStage.isActive = false;
      matchStage.isBlocked = { $ne: true };
    }
  }

  if (category) {
    matchStage.vendorCategory = category;
  }

  if (search?.trim()) {
    const searchRegex = new RegExp(search.trim(), "i");
    matchStage.$or = [
      { name: searchRegex },
      { companyName: searchRegex },
      { gstNumber: searchRegex },
      { email: searchRegex },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortDir = sortOrder === "asc" ? 1 : -1;

  // Aggregation pipeline — Rule 9 from backend-rules: prefer $lookup over .populate()
  const pipeline = [
    { $match: matchStage },
    {
      $addFields: {
        vendorStatus: {
          $cond: [
            { $eq: ["$isBlocked", true] },
            "Blocked",
            {
              $cond: [{ $eq: ["$isActive", true] }, "Active", "Inactive"],
            },
          ],
        },
      },
    },
    {
      $project: {
        name: 1,
        email: 1,
        companyName: 1,
        gstNumber: 1,
        phone: 1,
        country: 1,
        vendorCategory: 1,
        vendorStatus: 1,
        isActive: 1,
        isBlocked: 1,
        createdAt: 1,
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

  const result = await User.aggregate(pipeline);
  const vendors = result[0]?.data || [];
  const total = result[0]?.totalCount[0]?.count || 0;

  // Stats counts
  const statsPipeline = [
    { $match: { role: "vendor" } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ["$isActive", true] }, { $ne: ["$isBlocked", true] }] },
              1,
              0,
            ],
          },
        },
        inactive: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ["$isActive", false] }, { $ne: ["$isBlocked", true] }] },
              1,
              0,
            ],
          },
        },
        blocked: {
          $sum: { $cond: [{ $eq: ["$isBlocked", true] }, 1, 0] },
        },
      },
    },
  ];

  const statsResult = await User.aggregate(statsPipeline);
  const stats = statsResult[0] || { total: 0, active: 0, inactive: 0, blocked: 0 };

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        vendors,
        stats,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
      "Vendors fetched successfully"
    )
  );
});

// =====================================================================
// GET SINGLE VENDOR
// GET /api/v1/vendors/:id
// =====================================================================
const getVendorById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid vendor ID");
  }

  const pipeline = [
    { $match: { _id: new mongoose.Types.ObjectId(id), role: "vendor" } },
    {
      $addFields: {
        vendorStatus: {
          $cond: [
            { $eq: ["$isBlocked", true] },
            "Blocked",
            { $cond: [{ $eq: ["$isActive", true] }, "Active", "Inactive"] },
          ],
        },
      },
    },
    {
      // Count RFQs this vendor is assigned to
      $lookup: {
        from: "rfqs",
        let: { vendorId: "$_id" },
        pipeline: [
          { $match: { $expr: { $in: ["$$vendorId", "$assignedVendors"] } } },
          { $count: "count" },
        ],
        as: "rfqStats",
      },
    },
    {
      $addFields: {
        assignedRFQCount: { $ifNull: [{ $arrayElemAt: ["$rfqStats.count", 0] }, 0] },
      },
    },
    {
      $project: {
        password: 0,
        refreshToken: 0,
        rfqStats: 0,
      },
    },
  ];

  const result = await User.aggregate(pipeline);
  const vendor = result[0];

  if (!vendor) {
    throw new ApiError(404, "Vendor not found");
  }

  return res.status(200).json(new ApiResponse(200, vendor, "Vendor fetched successfully"));
});

// =====================================================================
// CREATE VENDOR (Register a vendor account)
// POST /api/v1/vendors
// Role: admin, procurement_officer
// =====================================================================
const createVendor = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password = "Vendor@123", // Default password — vendor should reset
    companyName,
    gstNumber,
    phone,
    country,
    vendorCategory,
  } = req.body;

  if (!name?.trim()) throw new ApiError(400, "Vendor name is required");
  if (!email?.trim()) throw new ApiError(400, "Email is required");
  if (!companyName?.trim()) throw new ApiError(400, "Company name is required");

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    throw new ApiError(409, "A user with this email already exists");
  }

  const vendor = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    role: "vendor",
    companyName: companyName.trim(),
    gstNumber: gstNumber?.trim(),
    phone: phone?.trim(),
    country: country?.trim() || "India",
    vendorCategory: vendorCategory?.trim(),
    isActive: true,
  });

  // Activity tracking — Rule 7
  await ActivityLog.create({
    action: `Vendor registered: ${vendor.companyName} (${vendor.email})`,
    entityType: "Vendor",
    entityId: vendor._id,
    performedBy: req.user._id,
    details: { companyName: vendor.companyName, category: vendor.vendorCategory },
  }).catch(() => {});

  const safeVendor = {
    _id: vendor._id,
    name: vendor.name,
    email: vendor.email,
    companyName: vendor.companyName,
    gstNumber: vendor.gstNumber,
    phone: vendor.phone,
    country: vendor.country,
    vendorCategory: vendor.vendorCategory,
    vendorStatus: "Active",
  };

  return res
    .status(201)
    .json(new ApiResponse(201, safeVendor, "Vendor registered successfully"));
});

// =====================================================================
// UPDATE VENDOR STATUS
// PATCH /api/v1/vendors/:id/status
// Role: admin only
// =====================================================================
const updateVendorStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid vendor ID");
  }

  const allowed = ["Active", "Inactive", "Blocked"];
  if (!allowed.includes(status)) {
    throw new ApiError(400, `Status must be one of: ${allowed.join(", ")}`);
  }

  const vendor = await User.findOne({ _id: id, role: "vendor" });
  if (!vendor) throw new ApiError(404, "Vendor not found");

  // Apply status transitions
  vendor.isBlocked = status === "Blocked";
  vendor.isActive = status === "Active";
  await vendor.save({ validateBeforeSave: false });

  // Activity tracking — Rule 7
  await ActivityLog.create({
    action: `Vendor status updated to "${status}": ${vendor.companyName}`,
    entityType: "Vendor",
    entityId: vendor._id,
    performedBy: req.user._id,
    details: { previousStatus: vendor.isActive ? "Active" : "Inactive", newStatus: status },
  }).catch(() => {});

  return res
    .status(200)
    .json(new ApiResponse(200, { vendorStatus: status }, `Vendor status updated to ${status}`));
});

// =====================================================================
// UPDATE VENDOR PROFILE
// PATCH /api/v1/vendors/:id
// Role: admin, procurement_officer
// =====================================================================
const updateVendor = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid vendor ID");
  }

  const { name, companyName, gstNumber, phone, country, vendorCategory } = req.body;

  const vendor = await User.findOne({ _id: id, role: "vendor" });
  if (!vendor) throw new ApiError(404, "Vendor not found");

  // Only update provided fields — never touch password here
  if (name?.trim()) vendor.name = name.trim();
  if (companyName?.trim()) vendor.companyName = companyName.trim();
  if (gstNumber !== undefined) vendor.gstNumber = gstNumber.trim();
  if (phone !== undefined) vendor.phone = phone.trim();
  if (country?.trim()) vendor.country = country.trim();
  if (vendorCategory?.trim()) vendor.vendorCategory = vendorCategory.trim();

  await vendor.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, { _id: vendor._id, companyName: vendor.companyName }, "Vendor updated successfully"));
});

// =====================================================================
// GET ACTIVE VENDORS (for dropdowns / RFQ assignment)
// GET /api/v1/vendors/active
// Role: procurement_officer, admin
// =====================================================================
const getActiveVendors = asyncHandler(async (req, res) => {
  const vendors = await User.find(
    { role: "vendor", isActive: true, isBlocked: { $ne: true } },
    { name: 1, email: 1, companyName: 1, vendorCategory: 1, gstNumber: 1 }
  ).sort({ companyName: 1 });

  return res
    .status(200)
    .json(new ApiResponse(200, vendors, "Active vendors fetched successfully"));
});

export {
  getAllVendors,
  getVendorById,
  createVendor,
  updateVendorStatus,
  updateVendor,
  getActiveVendors,
};
