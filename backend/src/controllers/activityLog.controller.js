import { ActivityLog } from "../models/activityLog.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ======================================================================
// GET /api/v1/activity-logs
// Lists all activity logs, newest first. Supports search + date filters.
// ======================================================================
const getActivityLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, entityType, search, dateFrom, dateTo } = req.query;

  const query = {};
  if (entityType && entityType !== "All") query.entityType = entityType;

  if (search) {
    query.action = { $regex: search, $options: "i" };
  }

  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo)   query.createdAt.$lte = new Date(new Date(dateTo).setHours(23, 59, 59, 999));
  }

  const skip  = (parseInt(page) - 1) * parseInt(limit);
  const total = await ActivityLog.countDocuments(query);

  const activities = await ActivityLog.find(query)
    .populate("performedBy", "name email role")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  return res.status(200).json(
    new ApiResponse(200, {
      activities,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    }, "Activity logs retrieved successfully")
  );
});

// ======================================================================
// GET /api/v1/activity-logs/grouped
// Groups logs by entityId + entityType so the Activity page can show
// procurement timelines (one card per entity, expandable history).
// Maps our schema fields to what Activity.jsx expects.
// ======================================================================
const getGroupedActivityLogs = asyncHandler(async (req, res) => {
  const { search, dateFrom, dateTo } = req.query;

  const match = {};

  if (search) {
    match.action = { $regex: search, $options: "i" };
  }
  if (dateFrom || dateTo) {
    match.createdAt = {};
    if (dateFrom) match.createdAt.$gte = new Date(dateFrom);
    if (dateTo)   match.createdAt.$lte = new Date(new Date(dateTo).setHours(23, 59, 59, 999));
  }

  const groups = await ActivityLog.aggregate([
    { $match: match },
    { $sort: { createdAt: 1 } },
    {
      $group: {
        _id:        "$entityId",
        entityType: { $first: "$entityType" },
        latestAt:   { $last: "$createdAt" },
        // Map our fields to what Activity.jsx expects
        logs: {
          $push: {
            _id:        "$_id",
            actionType: "$action",      // Activity.jsx reads .actionType
            description: "$action",     // Activity.jsx reads .description
            entityType: "$entityType",
            entityId:   "$entityId",
            metadata:   "$details",     // Activity.jsx reads .metadata
            createdAt:  "$createdAt",
          }
        },
        amount: { $max: "$details.totalAmount" },
      }
    },
    { $sort: { latestAt: -1 } },
  ]);

  return res.status(200).json({
    success: true,
    data: { groups, total: groups.length },
  });
});

// ======================================================================
// GET /api/v1/activity-logs/recent
// Returns 10 most recent logs (for dashboard feed).
// ======================================================================
const getRecentActivities = asyncHandler(async (req, res) => {
  const activities = await ActivityLog.find()
    .populate("performedBy", "name role")
    .sort({ createdAt: -1 })
    .limit(10);

  return res.status(200).json(
    new ApiResponse(200, activities, "Recent activities retrieved successfully")
  );
});

export { getActivityLogs, getGroupedActivityLogs, getRecentActivities };
