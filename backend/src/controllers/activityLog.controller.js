import { ActivityLog } from "../models/activityLog.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// GET /api/v1/activity-logs
// Supports: search, actionType, entityType, dateFrom, dateTo, minAmount, maxAmount, page, limit
const getActivityLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, actionType, entityType, search, dateFrom, dateTo, minAmount, maxAmount } = req.query;

  const query = {};

  if (actionType && actionType !== 'All Actions') query.actionType = actionType;
  if (entityType && entityType !== 'All Types')   query.entityType = entityType;

  if (search) {
    query.$or = [
      { description: { $regex: search, $options: 'i' } },
      { entityId:    { $regex: search, $options: 'i' } },
    ];
  }

  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo)   query.createdAt.$lte = new Date(new Date(dateTo).setHours(23, 59, 59, 999));
  }

  // Filter by amount embedded in metadata
  if (minAmount || maxAmount) {
    query['metadata.grandTotal'] = {};
    if (minAmount) query['metadata.grandTotal'].$gte = Number(minAmount);
    if (maxAmount) query['metadata.grandTotal'].$lte = Number(maxAmount);
  }

  const skip  = (parseInt(page) - 1) * parseInt(limit);
  const total = await ActivityLog.countDocuments(query);

  const activities = await ActivityLog.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  return res.status(200).json(
    new ApiResponse(200, { activities, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) }, "Activity logs retrieved successfully")
  );
});

// GET /api/v1/activity-logs/grouped
// Returns logs grouped by entityId, each group sorted chronologically
const getGroupedActivityLogs = asyncHandler(async (req, res) => {
  const { actionType, entityType, search, dateFrom, dateTo } = req.query;

  const match = {};
  if (actionType && actionType !== 'All Actions') match.actionType = actionType;
  if (entityType && entityType !== 'All Types')   match.entityType = entityType;
  if (search) {
    match.$or = [
      { description: { $regex: search, $options: 'i' } },
      { entityId:    { $regex: search, $options: 'i' } },
    ];
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
        _id:       '$entityId',
        entityType: { $first: '$entityType' },
        logs:       { $push: '$$ROOT' },
        latestAt:   { $last: '$createdAt' },
        // Grab description from the first REQUEST_CREATED or first log
        firstDesc:  { $first: '$description' },
        // Try to pull grandTotal from metadata
        grandTotal: { $max: '$metadata.grandTotal' },
        amount:     { $max: '$metadata.amount' },
      }
    },
    { $sort: { latestAt: -1 } },
  ]);

  return res.status(200).json(
    new ApiResponse(200, { groups, total: groups.length }, "Grouped activity logs retrieved")
  );
});

const getRecentActivities = asyncHandler(async (req, res) => {
  const activities = await ActivityLog.find().sort({ createdAt: -1 }).limit(10);
  return res.status(200).json(new ApiResponse(200, activities, "Recent activities retrieved successfully"));
});

export { getActivityLogs, getGroupedActivityLogs, getRecentActivities };
