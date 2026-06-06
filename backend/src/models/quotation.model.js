import mongoose, { Schema } from "mongoose";

// ============================================================
// Quotation Line Item Sub-Schema
// Mirrors the RFQ line items — vendor fills price + notes
// ============================================================
const quotationLineItemSchema = new Schema(
  {
    rfqLineItemId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    itemName: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    unit: {
      type: String,
      trim: true,
      default: "NOS",
    },
    unitPrice: {
      type: Number,
      required: [true, "Unit price is required"],
      min: [0, "Unit price cannot be negative"],
    },
    totalPrice: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { _id: true }
);

// ============================================================
// Quotation Schema
// Rule 1: A quotation cannot exist without an RFQ
// Rule 5: Managers cannot submit quotations
// ============================================================
const quotationSchema = new Schema(
  {
    rfq: {
      type: Schema.Types.ObjectId,
      ref: "RFQ",
      required: [true, "RFQ reference is required"],
      index: true,
    },
    quotationNumber: {
      type: String,
      unique: true,
      index: true,
    },
    vendor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Vendor reference is required"],
      index: true,
    },
    lineItems: {
      type: [quotationLineItemSchema],
      validate: {
        validator: (v) => v.length > 0,
        message: "At least one line item is required",
      },
    },
    subtotal: {
      type: Number,
      default: 0,
    },
    taxPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "INR",
      trim: true,
    },
    validUntil: {
      type: Date,
    },
    deliveryDays: {
      type: Number,
      min: 0,
    },
    paymentTerms: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Draft", "Submitted", "Accepted", "Rejected"],
      default: "Draft",
      index: true,
    },
    // Set when procurement officer selects this quotation as winner
    selectedAt: {
      type: Date,
    },
    selectedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// ============================================================
// Pre-save: Auto-generate quotation number + compute totals
// Mongoose v8+: async middleware via Promise — do NOT call next()
// ============================================================
quotationSchema.pre("save", async function () {
  // Auto-number on creation
  if (this.isNew) {
    const year = new Date().getFullYear();
    const count = await mongoose.model("Quotation").countDocuments();
    this.quotationNumber = `QT-${year}-${String(count + 1).padStart(4, "0")}`;
  }

  // Recalculate totals whenever line items change
  if (this.isModified("lineItems") || this.isModified("taxPercent")) {
    let subtotal = 0;
    this.lineItems.forEach((item) => {
      item.totalPrice = item.unitPrice * item.quantity;
      subtotal += item.totalPrice;
    });
    this.subtotal = subtotal;
    this.taxAmount = parseFloat(((subtotal * this.taxPercent) / 100).toFixed(2));
    this.totalAmount = parseFloat((subtotal + this.taxAmount).toFixed(2));
  }
});

// ============================================================
// Compound index: one quotation per vendor per RFQ
// ============================================================
quotationSchema.index({ rfq: 1, vendor: 1 }, { unique: true });

export const Quotation = mongoose.model("Quotation", quotationSchema);
