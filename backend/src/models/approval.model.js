import mongoose, { Schema } from "mongoose";

// ============================================================
// Approval Schema
// Rule 2: A purchase order cannot exist without an approved quotation
// Rule 5: Managers cannot submit quotations (they approve them)
// ============================================================
const approvalSchema = new Schema(
  {
    quotation: {
      type: Schema.Types.ObjectId,
      ref: "Quotation",
      required: [true, "Quotation reference is required"],
      index: true,
    },
    rfq: {
      type: Schema.Types.ObjectId,
      ref: "RFQ",
      required: true,
      index: true,
    },
    // Who requested the approval (procurement officer)
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Approval chain — ordered array of approver steps
    approvalChain: [
      {
        level: { type: Number, required: true }, // 1 = L1, 2 = L2, etc.
        label: { type: String, default: "L1 Review" },
        approver: { type: Schema.Types.ObjectId, ref: "User" },
        approverName: { type: String }, // Snapshot of name at time of assignment
        status: {
          type: String,
          enum: ["Pending", "Approved", "Rejected"],
          default: "Pending",
        },
        remarks: { type: String, trim: true },
        decidedAt: { type: Date },
      },
    ],
    // Overall status derived from the chain
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
      index: true,
    },
    // Summary data snapshotted at approval creation for display
    snapshot: {
      vendorName: String,
      rfqNumber: String,
      rfqTitle: String,
      totalAmount: Number,
      currency: { type: String, default: "INR" },
    },
    rejectionReason: { type: String, trim: true },
    finalizedAt: { type: Date },
  },
  { timestamps: true }
);

export const Approval = mongoose.model("Approval", approvalSchema);
