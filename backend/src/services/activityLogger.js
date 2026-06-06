import { ActivityLog } from "../models/activityLog.model.js";

export const logActivity = async ({
  userId,
  companyId,
  actionType,
  entityType,
  entityId,
  description,
  metadata = {},
}) => {
  try {
    if (!userId || !actionType || !entityType || !entityId || !description) {
      throw new Error("Missing required fields for activity logging");
    }

    const newActivity = await ActivityLog.create({
      userId,
      companyId,
      actionType,
      entityType,
      entityId,
      description,
      metadata,
    });

    return newActivity;
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
};
