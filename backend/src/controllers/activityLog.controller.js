import { ActivityLog } from "../models/activityLog.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getActivityLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, actionType, userId, entityType, search } = req.query;

  const query = {};

  if (actionType) query.actionType = actionType;
  if (userId) query.userId = userId;
  if (entityType) query.entityType = entityType;
  
  if (search) {
      query.$or = [
          { description: { $regex: search, $options: 'i' } },
          { entityId: { $regex: search, $options: 'i' } }
      ]
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const activities = await ActivityLog.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await ActivityLog.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        activities,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
      "Activity logs retrieved successfully"
    )
  );
});

const getRecentActivities = asyncHandler(async (req, res) => {
  const activities = await ActivityLog.find()
    .sort({ createdAt: -1 })
    .limit(10);

  return res.status(200).json(
    new ApiResponse(200, activities, "Recent activities retrieved successfully")
  );
});

export { getActivityLogs, getRecentActivities };
