import { Approval } from '../models/approval.model.js';
import { PurchaseOrder } from '../models/purchaseOrder.model.js';
import { Invoice } from '../models/invoice.model.js';
import { ActivityLog } from '../models/activityLog.model.js';

// ── Helper: write an activity log entry ──────────────────────────────────────
async function logActivity({ actionType, entityType, entityId, description, metadata = {} }) {
  try {
    await ActivityLog.create({
      userId:      'system',   // no auth yet; will be replaced with real userId once RBAC added
      actionType,
      entityType,
      entityId:    String(entityId),
      description,
      metadata,
    });
  } catch (e) {
    console.error('[ActivityLog] Failed to write log:', e.message);
  }
}

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

  // Log PO generation
  await logActivity({
    actionType:  'PO_GENERATED',
    entityType:  'PurchaseOrder',
    entityId:    po._id,
    description: `PO ${poNumber} generated for "${approval.rfqTitle}" (${approval.vendor?.name}) — Total: ₹${grandTotal.toLocaleString('en-IN')} incl. GST`,
    metadata:    { subtotal, cgst, sgst, grandTotal, poNumber },
  });

  // Log invoice generation
  await logActivity({
    actionType:  'INVOICE_GENERATED',
    entityType:  'Invoice',
    entityId:    invoice._id,
    description: `Invoice generated for PO ${poNumber} — ₹${grandTotal.toLocaleString('en-IN')} due by ${dueDate.toLocaleDateString('en-IN')}`,
    metadata:    { poId: po._id, grandTotal, dueDate },
  });

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
      vendorRating: 0,
      category: category || 'Other',
      lineItems,
      status: 'Pending',
      currentStep: 0,
      chain: [L1, L2],
    });

    await logActivity({
      actionType:  'REQUEST_CREATED',
      entityType:  'Approval',
      entityId:    newApproval._id,
      description: `New procurement request created: "${rfqTitle}" from ${vendorName} — ₹${quotationAmount.toLocaleString('en-IN')} (${category || 'Other'})`,
      metadata:    { rfqTitle, vendorName, amount: quotationAmount, category },
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

    step.status    = 'approved';
    step.remarks   = remarks.trim();
    step.timestamp = new Date();

    const nextStep = approval.currentStep + 1;
    let invoiceId = null;

    if (nextStep >= approval.chain.length) {
      // All steps done → fully Approved
      approval.status = 'Approved';
      await approval.save();

      // Log L2 approval
      await logActivity({
        actionType:  'APPROVAL_APPROVED',
        entityType:  'Approval',
        entityId:    approval._id,
        description: `${step.name} (${step.role}) approved "${approval.rfqTitle}" — fully approved. PO & Invoice being generated.`,
        metadata:    { approver: step.name, role: step.role, remarks: remarks.trim() },
      });

      const { invoice } = await generatePOAndInvoice(approval);
      invoiceId = invoice._id;
    } else {
      // Advance to next step
      approval.currentStep = nextStep;
      await approval.save();

      await logActivity({
        actionType:  'APPROVAL_APPROVED',
        entityType:  'Approval',
        entityId:    approval._id,
        description: `${step.name} (${step.role}) approved "${approval.rfqTitle}" — advancing to ${approval.chain[nextStep]?.name} for final sign-off.`,
        metadata:    { approver: step.name, role: step.role, remarks: remarks.trim(), nextApprover: approval.chain[nextStep]?.name },
      });
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

    await logActivity({
      actionType:  'APPROVAL_REJECTED',
      entityType:  'Approval',
      entityId:    approval._id,
      description: `${step?.name || 'Approver'} (${step?.role || ''}) rejected "${approval.rfqTitle}" — "${remarks.trim()}"`,
      metadata:    { approver: step?.name, role: step?.role, remarks: remarks.trim() },
    });

    res.json({ success: true, data: approval, message: 'Approval rejected.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/v1/approvals/:id/pay-invoice  — mark invoice as Paid
export const markInvoicePaid = async (req, res) => {
  try {
    const approval = await Approval.findById(req.params.id);
    if (!approval) return res.status(404).json({ success: false, message: 'Approval not found' });

    const po = await PurchaseOrder.findOne({ approvalId: approval._id });
    if (!po) return res.status(404).json({ success: false, message: 'PO not found' });

    const invoice = await Invoice.findOne({ purchaseOrderId: po._id });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    invoice.status = 'Paid';
    await invoice.save();
    po.status = 'Completed';
    await po.save();

    await logActivity({
      actionType:  'INVOICE_GENERATED',
      entityType:  'Invoice',
      entityId:    invoice._id,
      description: `Invoice for "${approval.rfqTitle}" marked as Paid — ₹${po.grandTotal.toLocaleString('en-IN')}`,
      metadata:    { poId: po._id, invoiceId: invoice._id, grandTotal: po.grandTotal },
    });

    res.json({ success: true, message: 'Invoice marked as Paid.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
