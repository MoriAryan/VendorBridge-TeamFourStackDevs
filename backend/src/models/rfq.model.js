import mongoose, { Schema } from "mongoose";

// ============================================================
// Line Item Sub-Schema — what exactly is being requested
// ============================================================
const lineItemSchema = new Schema(
  {
    item: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
    },
    qty: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    unit: {
      type: String,
      trim: true,
      default: "NOS", // Number of Sets — common procurement default
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { _id: true }
);

// ============================================================
// RFQ Schema — the foundation of the procurement lifecycle
// Rule 1: A quotation cannot exist without an RFQ
// ============================================================
const rfqSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "RFQ title is required"],
      trim: true,
      index: true,
    },
    rfqNumber: {
      type: String,
      unique: true,
      index: true,
      // Auto-generated in pre-save hook below
    },
    category: {
      type: String,
      trim: true,
    },
    deadline: {
      type: Date,
      required: [true, "Deadline is required"],
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    lineItems: {
      type: [lineItemSchema],
      validate: {
        validator: (v) => v.length > 0,
        message: "At least one line item is required",
      },
    },
    assignedVendors: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    attachments: [
      {
        filename: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ["Draft", "Open", "Closed", "Expired"],
      default: "Draft",
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// ============================================================
// Pre-save Hook: Auto-generate RFQ number (e.g., RFQ-2025-0001)
// ============================================================
rfqSchema.pre("save", async function (next) {
  if (this.isNew) {
    const year = new Date().getFullYear();
    const count = await mongoose.model("RFQ").countDocuments();
    this.rfqNumber = `RFQ-${year}-${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

// ============================================================
// Index for text search on title and category
// ============================================================
rfqSchema.index({ title: "text", category: "text" });

export const RFQ = mongoose.model("RFQ", rfqSchema);
