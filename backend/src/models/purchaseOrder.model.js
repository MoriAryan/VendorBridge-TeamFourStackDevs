import mongoose from 'mongoose';

const lineItemSchema = new mongoose.Schema({
  item:      { type: String, required: true },
  qty:       { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  total:     { type: Number, required: true },
}, { _id: false });

const purchaseOrderSchema = new mongoose.Schema({
  poNumber:   { type: String, unique: true, required: true },
  approvalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Approval', required: true },
  billTo: {
    name:    { type: String, required: true },
    address: { type: String, default: '' },
    gstin:   { type: String, default: '' },
  },
  vendor: {
    name:    { type: String, required: true },
    address: { type: String, default: '' },
    gstin:   { type: String, default: '' },
  },
  lineItems:  [lineItemSchema],
  subtotal:   { type: Number, required: true },
  cgst:       { type: Number, required: true },
  sgst:       { type: Number, required: true },
  grandTotal: { type: Number, required: true },
  // context.md statuses: Generated | Issued | Completed | Cancelled
  status: {
    type:    String,
    enum:    ['Generated', 'Issued', 'Completed', 'Cancelled'],
    default: 'Generated',
  },
  poDate:  { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
}, { timestamps: true });

export const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);
