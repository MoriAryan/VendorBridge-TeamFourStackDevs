import mongoose from 'mongoose';

const chainStepSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  role:      { type: String, required: true },
  initials:  { type: String, required: true },
  status:    { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  remarks:   { type: String, default: '' },
  timestamp: { type: Date },
}, { _id: false });

const approvalSchema = new mongoose.Schema({
  rfqTitle:        { type: String, required: true },
  vendor: {
    name:    { type: String, required: true },
    address: { type: String, default: '' },
    gstin:   { type: String, default: '' },
  },
  quotationAmount: { type: Number, required: true },
  deliveryDays:    { type: Number, required: true },
  vendorRating:    { type: Number, default: 0 },
  category:        { type: String, default: '' },
  lineItems: [{
    item:      String,
    qty:       Number,
    unitPrice: Number,
  }],
  status:      { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  chain:       [chainStepSchema],
  currentStep: { type: Number, default: 0 },
}, { timestamps: true });

export const Approval = mongoose.model('Approval', approvalSchema);
