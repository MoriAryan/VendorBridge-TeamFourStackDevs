import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  purchaseOrderId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'PurchaseOrder',
    required: true,
  },
  invoiceDate: { type: Date, default: Date.now },
  dueDate:     { type: Date, required: true },
  // context.md statuses: Generated | Sent | Paid | Overdue
  status: {
    type:    String,
    enum:    ['Generated', 'Sent', 'Paid', 'Overdue'],
    default: 'Sent',
  },
  paidAt: { type: Date },
}, { timestamps: true });

// Auto-flag as Overdue before each find (Rule: system auto-flags)
invoiceSchema.pre('find', async function () {
  await mongoose.model('Invoice').updateMany(
    { dueDate: { $lt: new Date() }, status: 'Sent' },
    { $set: { status: 'Overdue' } }
  );
});

export const Invoice = mongoose.model('Invoice', invoiceSchema);
