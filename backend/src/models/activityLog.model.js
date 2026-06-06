import mongoose, { Schema } from "mongoose";

/**
 * ActivityLog — Append-only audit trail.
 * 
 * CRITICAL: These records must NEVER be updated or deleted.
 * The schema deliberately omits any soft-delete fields.
 * No controller should ever call .findByIdAndUpdate() or .deleteOne() on this model.
 * This enforces Rule 6 (Workflow history must remain traceable) and Rule 7.
 */
const activityLogSchema = new Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true,
      // Human-readable description: "RFQ created", "Quotation submitted", etc.
    },
    entityType: {
      type: String,
      required: true,
      enum: ["RFQ", "Quotation", "Approval", "PurchaseOrder", "Invoice", "Vendor", "User"],
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    details: {
      type: Schema.Types.Mixed,
      // Stores extra context: { title, status, vendorCount, etc. }
    },
    ipAddress: {
      type: String,
    },
  },
  {
    timestamps: true,
    // Mongoose-level: no versionKey needed for append-only records
    versionKey: false,
  }
);

// Compound index for efficient audit trail queries
activityLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
activityLogSchema.index({ performedBy: 1, createdAt: -1 });

export const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
