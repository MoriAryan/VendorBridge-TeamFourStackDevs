import { Approval } from '../models/approval.model.js';
import { PurchaseOrder } from '../models/purchaseOrder.model.js';
import { Invoice } from '../models/invoice.model.js';

// ── Helper: auto-generate PO + Invoice after full approval ──────────────────
async function generatePOAndInvoice(approval) {
  const lineItems = approval.lineItems.map((li) => ({
    item:      li.item,
    qty:       li.qty,
    unitPrice: li.unitPrice,
    total:     li.qty * li.unitPrice,
  }));

  const subtotal   = lineItems.reduce((sum, li) => sum + li.total, 0);
  const cgst       = Math.round(subtotal * 0.09);
  const sgst       = Math.round(subtotal * 0.09);
  const grandTotal = subtotal + cgst + sgst;

  const poDate  = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  const poNumber = `PO-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;

  const po = await PurchaseOrder.create({
    poNumber,
    approvalId: approval._id,
    billTo:  { name: 'VendorBridge Pvt. Ltd.', address: '14th Floor, Prestige Trade Tower, MG Road, Bengaluru - 560001', gstin: '29AABCV1234M1Z5' },
    vendor:  approval.vendor,
    lineItems,
    subtotal,
    cgst,
    sgst,
    grandTotal,
    status:  'Issued',
    poDate,
    dueDate,
  });

  const invoice = await Invoice.create({
    purchaseOrderId: po._id,
    invoiceDate:     new Date(),
    dueDate,
    status:          'Sent',
  });

  console.log(`[Activity] PO ${poNumber} generated and Invoice created for approval ${approval._id}`);
  return { po, invoice };
}

// POST /api/v1/approvals
export const createApproval = async (req, res) => {
  try {
    const { rfqTitle, vendorName, amount, category } = req.body;
    if (!rfqTitle || !vendorName || !amount) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const L1 = { name: 'Rahul Mehta', role: 'Procurement Head (L1)', initials: 'RM', status: 'pending' };
    const L2 = { name: 'Priya Shah', role: 'Manager (L2)', initials: 'PS', status: 'pending' };

    const quotationAmount = Number(amount);
    const lineItems = [{ item: 'General Requirement', qty: 1, unitPrice: quotationAmount }];

    const newApproval = await Approval.create({
      rfqTitle,
      vendor: { name: vendorName, address: 'Pending Vendor Details', gstin: 'PENDING' },
      quotationAmount,
      deliveryDays: 14,
      vendorRating: 0, // Unrated initially
      category: category || 'Other',
      lineItems,
      status: 'Pending',
      currentStep: 0,
      chain: [L1, L2],
    });

    res.status(201).json({ success: true, data: newApproval });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/approvals
export const getApprovals = async (req, res) => {
  try {
    const approvals = await Approval.find().sort({ createdAt: -1 });
    res.json({ success: true, data: approvals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/approvals/:id
export const getApprovalById = async (req, res) => {
  try {
    const approval = await Approval.findById(req.params.id);
    if (!approval) return res.status(404).json({ success: false, message: 'Approval not found' });

    // If approved, also return the generated invoice ID for navigation
    let invoiceId = null;
    if (approval.status === 'Approved') {
      const po      = await PurchaseOrder.findOne({ approvalId: approval._id });
      const invoice = po ? await Invoice.findOne({ purchaseOrderId: po._id }) : null;
      invoiceId     = invoice?._id || null;
    }

    res.json({ success: true, data: approval, invoiceId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/v1/approvals/:id/approve   body: { remarks }
export const approveStep = async (req, res) => {
  try {
    const { remarks } = req.body;
    if (!remarks?.trim()) return res.status(400).json({ success: false, message: 'Remarks are required.' });

    const approval = await Approval.findById(req.params.id);
    if (!approval) return res.status(404).json({ success: false, message: 'Approval not found' });
    if (approval.status !== 'Pending') {
      return res.status(400).json({ success: false, message: `Approval is already ${approval.status}.` });
    }

    const step = approval.chain[approval.currentStep];
    if (!step) return res.status(400).json({ success: false, message: 'No active approval step.' });

    // ── Mark ONLY the current step as approved ─────────────────────────────
    step.status    = 'approved';
    step.remarks   = remarks.trim();
    step.timestamp = new Date();

    const nextStep = approval.currentStep + 1;

    let invoiceId = null;

    if (nextStep >= approval.chain.length) {
      // ── All steps done → fully Approved, generate PO + Invoice ────────────
      approval.status = 'Approved';
      await approval.save();
      const { invoice } = await generatePOAndInvoice(approval);
      invoiceId = invoice._id;
      console.log(`[Activity] Quotation for RFQ "${approval.rfqTitle}" fully approved. Invoice generated.`);
    } else {
      // ── Advance to next step, keep status Pending ──────────────────────────
      approval.currentStep = nextStep;
      await approval.save();
      console.log(`[Activity] Step ${approval.currentStep} approved for "${approval.rfqTitle}". Awaiting step ${nextStep + 1}.`);
    }

    res.json({ success: true, data: approval, invoiceId, message: 'Step approved.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/v1/approvals/:id/reject   body: { remarks }
export const rejectApproval = async (req, res) => {
  try {
    const { remarks } = req.body;
    if (!remarks?.trim()) return res.status(400).json({ success: false, message: 'Remarks are required.' });

    const approval = await Approval.findById(req.params.id);
    if (!approval) return res.status(404).json({ success: false, message: 'Approval not found' });
    if (approval.status !== 'Pending') {
      return res.status(400).json({ success: false, message: `Approval is already ${approval.status}.` });
    }

    const step = approval.chain[approval.currentStep];
    if (step) {
      step.status    = 'rejected';
      step.remarks   = remarks.trim();
      step.timestamp = new Date();
    }
    approval.status = 'Rejected';
    await approval.save();

    console.log(`[Activity] Quotation for RFQ "${approval.rfqTitle}" rejected at step ${approval.currentStep + 1}.`);
    res.json({ success: true, data: approval, message: 'Approval rejected.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
