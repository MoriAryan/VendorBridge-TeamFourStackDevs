import mongoose, { Schema } from "mongoose";

const activityLogSchema = new Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: false, 
    },
    userId: {
      type: String,
      required: false,
      default: 'system',
    },
    actionType: {
      type: String,
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      required: true,
    },
    entityId: {
      type: String, 
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed, 
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ companyId: 1 });
activityLogSchema.index({ userId: 1 });
activityLogSchema.index({ actionType: 1 });

export const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
