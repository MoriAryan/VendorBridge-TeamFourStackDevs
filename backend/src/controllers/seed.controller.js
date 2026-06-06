import { Approval } from '../models/approval.model.js';
import { PurchaseOrder } from '../models/purchaseOrder.model.js';
import { Invoice } from '../models/invoice.model.js';
import { ActivityLog } from '../models/activityLog.model.js';

function build(rawItems) {
  const lineItems  = rawItems.map(li => ({ ...li, total: li.qty * li.unitPrice }));
  const subtotal   = lineItems.reduce((s, li) => s + li.total, 0);
  const cgst       = Math.round(subtotal * 0.09);
  const sgst       = Math.round(subtotal * 0.09);
  const grandTotal = subtotal + cgst + sgst;
  return { lineItems, subtotal, cgst, sgst, grandTotal };
}

const BILL_TO = {
  name:    'VendorBridge Pvt. Ltd.',
  address: '14th Floor, Prestige Trade Tower, MG Road, Bengaluru - 560001',
  gstin:   '29AABCV1234M1Z5',
};

const L1 = (status = 'pending', remarks = '', ts = null) => ({
  name: 'Rahul Mehta', role: 'Procurement Head (L1)', initials: 'RM',
  status, remarks, timestamp: ts,
});
const L2 = (status = 'pending', remarks = '', ts = null) => ({
  name: 'Priya Shah', role: 'Manager (L2)', initials: 'PS',
  status, remarks, timestamp: ts,
});

async function log(actionType, entityType, entityId, description, metadata = {}, createdAt = null) {
  const entry = { userId: 'system', actionType, entityType, entityId: String(entityId), description, metadata };
  const doc = await ActivityLog.create(entry);
  if (createdAt) { doc.createdAt = createdAt; await doc.save(); }
  return doc;
}

// GET /api/v1/seed          — seed if DB empty
// GET /api/v1/seed?force=1  — drop ALL data & reseed
export const seedData = async (req, res) => {
  try {
    if (req.query.force === '1') {
      await Promise.all([
        Approval.deleteMany({}),
        PurchaseOrder.deleteMany({}),
        Invoice.deleteMany({}),
        ActivityLog.deleteMany({}),
      ]);
    } else {
      const exists = await Approval.findOne();
      if (exists) {
        return res.json({ success: true, message: 'Already seeded. Use ?force=1 to reseed.', alreadySeeded: true });
      }
    }

    const now = new Date();
    const ago = (days, hours = 0) => new Date(now - (days * 86400 + hours * 3600) * 1000);

    // ══════════════════════════════════════════════════════════════════════
    // #1 — Office Furniture Q2  |  PENDING at L1 (not yet started)
    // ══════════════════════════════════════════════════════════════════════
    const t1 = build([
      { item: 'Ergonomic Chair', qty: 25, unitPrice: 4500 },
      { item: 'Standing Desk',   qty: 10, unitPrice: 5700 },
    ]);
    const a1 = await Approval.create({
      rfqTitle: 'Office Furniture Q2',
      vendor:   { name: 'Infra Supplies PVT LTD', address: '302, Industrial Zone, Sector 45, Gurgaon, Haryana - 122003', gstin: '06AADCI9876K2Z8' },
      quotationAmount: t1.subtotal, deliveryDays: 10, vendorRating: 4.5, category: 'Furniture',
      lineItems: t1.lineItems, status: 'Pending', currentStep: 0,
      chain: [L1(), L2()],
    });
    await log('REQUEST_CREATED', 'Approval', a1._id, `New RFQ created: "Office Furniture Q2" from Infra Supplies PVT LTD — ₹${t1.subtotal.toLocaleString('en-IN')} (Furniture)`, { rfqTitle: 'Office Furniture Q2', amount: t1.subtotal }, ago(5, 2));

    // ══════════════════════════════════════════════════════════════════════
    // #2 — IT Hardware Upgrade Q1  |  PENDING at L2 (L1 approved)
    // ══════════════════════════════════════════════════════════════════════
    const t2 = build([
      { item: 'Laptop (Dell Latitude 5540)', qty: 12, unitPrice: 78000 },
      { item: 'USB-C Docking Station',       qty: 12, unitPrice: 6500  },
      { item: 'Mechanical Keyboard',         qty: 12, unitPrice: 4200  },
    ]);
    const a2 = await Approval.create({
      rfqTitle: 'IT Hardware Upgrade Q1',
      vendor:   { name: 'TechCore LTD', address: 'Unit 5, MIDC, Andheri East, Mumbai - 400093', gstin: '27AABCT4567J1ZX' },
      quotationAmount: t2.subtotal, deliveryDays: 7, vendorRating: 4.2, category: 'IT Hardware',
      lineItems: t2.lineItems, status: 'Pending', currentStep: 1,
      chain: [
        L1('approved', 'Specs verified against budget allocation. Forwarding to Manager.', ago(3)),
        L2(),
      ],
    });
    await log('REQUEST_CREATED',  'Approval', a2._id, `New RFQ created: "IT Hardware Upgrade Q1" from TechCore LTD — ₹${t2.subtotal.toLocaleString('en-IN')} (IT Hardware)`, { amount: t2.subtotal }, ago(4, 0));
    await log('APPROVAL_APPROVED','Approval', a2._id, `Rahul Mehta (Procurement Head L1) approved "IT Hardware Upgrade Q1" — advancing to Priya Shah for final sign-off.`, { approver: 'Rahul Mehta', role: 'Procurement Head (L1)', remarks: 'Specs verified against budget allocation.' }, ago(3));

    // ══════════════════════════════════════════════════════════════════════
    // #3 — Office Stationery Q2  |  PENDING at L1 (not yet started)
    // ══════════════════════════════════════════════════════════════════════
    const t3 = build([
      { item: 'A4 Ream (500 sheets)',   qty: 50, unitPrice: 280 },
      { item: 'Whiteboard Marker Set',  qty: 30, unitPrice: 220 },
      { item: 'Sticky Notes (12 pack)', qty: 40, unitPrice: 180 },
      { item: 'File Folders (Box 100)', qty: 20, unitPrice: 350 },
    ]);
    const a3 = await Approval.create({
      rfqTitle: 'Office Stationery Q2',
      vendor:   { name: 'Office Needs Co.', address: '12, Market Road, Connaught Place, New Delhi - 110001', gstin: '07AABOF3210Q1ZR' },
      quotationAmount: t3.subtotal, deliveryDays: 2, vendorRating: 4.0, category: 'Stationery',
      lineItems: t3.lineItems, status: 'Pending', currentStep: 0,
      chain: [L1(), L2()],
    });
    await log('REQUEST_CREATED', 'Approval', a3._id, `New RFQ created: "Office Stationery Q2" from Office Needs Co. — ₹${t3.subtotal.toLocaleString('en-IN')} (Stationery)`, { amount: t3.subtotal }, ago(2, 4));

    // ══════════════════════════════════════════════════════════════════════
    // #4 — Logistics Services Q2  |  APPROVED → PO Issued, Invoice OVERDUE
    // ══════════════════════════════════════════════════════════════════════
    const t4 = build([{ item: 'Monthly Logistics Contract (3 months)', qty: 3, unitPrice: 31500 }]);
    const a4 = await Approval.create({
      rfqTitle: 'Logistics Services — Q2 Contract',
      vendor:   { name: 'FastLog Transport', address: 'Plot 18, Transport Nagar, Pune - 411019', gstin: '27AABFL7890P1ZY' },
      quotationAmount: t4.subtotal, deliveryDays: 3, vendorRating: 3.8, category: 'Logistics',
      lineItems: t4.lineItems, status: 'Approved', currentStep: 1,
      chain: [
        L1('approved', 'Budget allocated — proceed.', ago(82)),
        L2('approved', 'Vendor vetted. Approved.', ago(81, 14)),
      ],
    });
    const po4 = await PurchaseOrder.create({
      poNumber: 'PO-2025-0029', approvalId: a4._id, billTo: BILL_TO, vendor: a4.vendor,
      lineItems: t4.lineItems, subtotal: t4.subtotal, cgst: t4.cgst, sgst: t4.sgst, grandTotal: t4.grandTotal,
      status: 'Issued', poDate: ago(81), dueDate: ago(51),
    });
    await Invoice.create({
      purchaseOrderId: po4._id, invoiceDate: ago(81), dueDate: ago(51), status: 'Overdue',
    });
    await log('REQUEST_CREATED',  'Approval',       a4._id,  `New RFQ created: "Logistics Services — Q2 Contract" from FastLog Transport — ₹${t4.subtotal.toLocaleString('en-IN')} (Logistics)`, { amount: t4.subtotal }, ago(83));
    await log('APPROVAL_APPROVED','Approval',       a4._id,  `Rahul Mehta (L1) approved "Logistics Services — Q2 Contract" — forwarding to Manager.`,               { approver: 'Rahul Mehta', remarks: 'Budget allocated — proceed.' }, ago(82));
    await log('APPROVAL_APPROVED','Approval',       a4._id,  `Priya Shah (Manager L2) approved "Logistics Services — Q2 Contract" — fully approved. PO & Invoice generated.`, { approver: 'Priya Shah' }, ago(81, 14));
    await log('PO_GENERATED',     'PurchaseOrder',  po4._id, `PO PO-2025-0029 generated for "Logistics Services — Q2 Contract" (FastLog Transport) — Total: ₹${t4.grandTotal.toLocaleString('en-IN')} incl. GST`, { grandTotal: t4.grandTotal, poNumber: 'PO-2025-0029' }, ago(81, 13));
    await log('INVOICE_GENERATED','Invoice',        po4._id, `Invoice generated for PO PO-2025-0029 — ₹${t4.grandTotal.toLocaleString('en-IN')}`,                       { grandTotal: t4.grandTotal }, ago(81, 12));

    // ══════════════════════════════════════════════════════════════════════
    // #5 — Server Room Cooling Unit  |  APPROVED → PO Completed, Invoice PAID
    // ══════════════════════════════════════════════════════════════════════
    const t5 = build([
      { item: 'Precision Cooling Unit (5-ton)', qty: 2, unitPrice: 145000 },
      { item: 'Installation & Commissioning',  qty: 1, unitPrice: 52000  },
    ]);
    const a5 = await Approval.create({
      rfqTitle: 'Server Room Cooling Unit',
      vendor:   { name: 'CoolTech Systems', address: 'B-12, Electronics City, Bengaluru - 560100', gstin: '29AAACT5678K1ZM' },
      quotationAmount: t5.subtotal, deliveryDays: 14, vendorRating: 4.7, category: 'Infrastructure',
      lineItems: t5.lineItems, status: 'Approved', currentStep: 1,
      chain: [
        L1('approved', 'Vendor approved, meets specs.', ago(57)),
        L2('approved', 'Aligned with infra roadmap.',  ago(56, 5)),
      ],
    });
    const po5 = await PurchaseOrder.create({
      poNumber: 'PO-2025-0041', approvalId: a5._id, billTo: BILL_TO, vendor: a5.vendor,
      lineItems: t5.lineItems, subtotal: t5.subtotal, cgst: t5.cgst, sgst: t5.sgst, grandTotal: t5.grandTotal,
      status: 'Completed', poDate: ago(56), dueDate: ago(26),
    });
    await Invoice.create({
      purchaseOrderId: po5._id, invoiceDate: ago(56), dueDate: ago(26), status: 'Paid', paidAt: ago(29),
    });
    await log('REQUEST_CREATED',  'Approval',      a5._id,  `New RFQ created: "Server Room Cooling Unit" from CoolTech Systems — ₹${t5.subtotal.toLocaleString('en-IN')} (Infrastructure)`, { amount: t5.subtotal }, ago(59));
    await log('APPROVAL_APPROVED','Approval',      a5._id,  `Rahul Mehta (L1) approved "Server Room Cooling Unit" — forwarding to Manager.`,           { approver: 'Rahul Mehta', remarks: 'Vendor approved, meets specs.' }, ago(57));
    await log('APPROVAL_APPROVED','Approval',      a5._id,  `Priya Shah (Manager L2) approved "Server Room Cooling Unit" — fully approved.`,           { approver: 'Priya Shah', remarks: 'Aligned with infra roadmap.' }, ago(56, 5));
    await log('PO_GENERATED',    'PurchaseOrder', po5._id,  `PO PO-2025-0041 generated for "Server Room Cooling Unit" (CoolTech Systems) — Total: ₹${t5.grandTotal.toLocaleString('en-IN')} incl. GST`, { grandTotal: t5.grandTotal, poNumber: 'PO-2025-0041' }, ago(56, 4));
    await log('INVOICE_GENERATED','Invoice',       po5._id, `Invoice generated for PO PO-2025-0041 — ₹${t5.grandTotal.toLocaleString('en-IN')}`,      { grandTotal: t5.grandTotal }, ago(56, 3));
    await log('INVOICE_GENERATED','Invoice',       po5._id, `Invoice for "Server Room Cooling Unit" marked as Paid — ₹${t5.grandTotal.toLocaleString('en-IN')}`, { status: 'Paid', grandTotal: t5.grandTotal }, ago(29));

    // ══════════════════════════════════════════════════════════════════════
    // #6 — Annual Software Licensing  |  REJECTED at L1
    // ══════════════════════════════════════════════════════════════════════
    const t6 = build([
      { item: 'MS Office 365 Business (Annual)', qty: 50, unitPrice: 12000 },
      { item: 'Adobe Creative Cloud (Annual)',   qty: 10, unitPrice: 58000 },
    ]);
    const a6 = await Approval.create({
      rfqTitle: 'Annual Software Licensing',
      vendor:   { name: 'SoftPro Distributors', address: 'C-44, IT Park, Whitefield, Bengaluru - 560066', gstin: '29AABSP1234L1ZK' },
      quotationAmount: t6.subtotal, deliveryDays: 1, vendorRating: 3.5, category: 'Software Licensing',
      lineItems: t6.lineItems, status: 'Rejected', currentStep: 0,
      chain: [
        L1('rejected', 'Budget frozen for Q2. Resubmit in Q3.', ago(14)),
        L2(),
      ],
    });
    await log('REQUEST_CREATED',  'Approval', a6._id, `New RFQ created: "Annual Software Licensing" from SoftPro Distributors — ₹${t6.subtotal.toLocaleString('en-IN')} (Software Licensing)`, { amount: t6.subtotal }, ago(16));
    await log('APPROVAL_REJECTED','Approval', a6._id, `Rahul Mehta (Procurement Head L1) rejected "Annual Software Licensing" — "Budget frozen for Q2. Resubmit in Q3."`, { approver: 'Rahul Mehta', remarks: 'Budget frozen for Q2.' }, ago(14));

    // ══════════════════════════════════════════════════════════════════════
    // #7 — Canteen Equipment Upgrade  |  REJECTED at L2
    // ══════════════════════════════════════════════════════════════════════
    const t7 = build([
      { item: 'Industrial Refrigerator', qty: 2, unitPrice: 45000 },
      { item: 'Commercial Microwave',    qty: 5, unitPrice: 12000 },
      { item: 'Coffee Vending Machine',  qty: 3, unitPrice: 28000 },
    ]);
    const a7 = await Approval.create({
      rfqTitle: 'Canteen Equipment Upgrade',
      vendor:   { name: 'KitchenPro Supplies', address: '55, Food Park, Navi Mumbai - 400705', gstin: '27AABKP5678M1ZQ' },
      quotationAmount: t7.subtotal, deliveryDays: 7, vendorRating: 4.1, category: 'Infrastructure',
      lineItems: t7.lineItems, status: 'Rejected', currentStep: 1,
      chain: [
        L1('approved', 'Necessary upgrade. Recommend approval.', ago(20)),
        L2('rejected', 'Non-critical spend. Defer to Q4 capex review.', ago(19)),
      ],
    });
    await log('REQUEST_CREATED',  'Approval', a7._id, `New RFQ created: "Canteen Equipment Upgrade" from KitchenPro Supplies — ₹${t7.subtotal.toLocaleString('en-IN')} (Infrastructure)`, { amount: t7.subtotal }, ago(22));
    await log('APPROVAL_APPROVED','Approval', a7._id, `Rahul Mehta (L1) approved "Canteen Equipment Upgrade" — forwarding to Manager.`, { approver: 'Rahul Mehta', remarks: 'Necessary upgrade.' }, ago(20));
    await log('APPROVAL_REJECTED','Approval', a7._id, `Priya Shah (Manager L2) rejected "Canteen Equipment Upgrade" — "Non-critical spend. Defer to Q4 capex review."`, { approver: 'Priya Shah', remarks: 'Non-critical spend.' }, ago(19));

    // ══════════════════════════════════════════════════════════════════════
    // #8 — Security Camera System  |  APPROVED → Invoice SENT (not yet paid)
    // ══════════════════════════════════════════════════════════════════════
    const t8 = build([
      { item: 'IP Camera (4K)',          qty: 20, unitPrice: 15000 },
      { item: 'NVR (32 Channel)',        qty: 2,  unitPrice: 42000 },
      { item: 'Installation Services',   qty: 1,  unitPrice: 35000 },
    ]);
    const a8 = await Approval.create({
      rfqTitle: 'Security Camera System — HQ',
      vendor:   { name: 'SecureVision Pvt Ltd', address: 'Plot 9, Electronics Enclave, Hyderabad - 500084', gstin: '36AABSV2345N1ZP' },
      quotationAmount: t8.subtotal, deliveryDays: 10, vendorRating: 4.3, category: 'Infrastructure',
      lineItems: t8.lineItems, status: 'Approved', currentStep: 1,
      chain: [
        L1('approved', 'Security compliance requirement. Approved.', ago(10)),
        L2('approved', 'Approved as per security audit mandate.', ago(9)),
      ],
    });
    const po8 = await PurchaseOrder.create({
      poNumber: 'PO-2025-0058', approvalId: a8._id, billTo: BILL_TO, vendor: a8.vendor,
      lineItems: t8.lineItems, subtotal: t8.subtotal, cgst: t8.cgst, sgst: t8.sgst, grandTotal: t8.grandTotal,
      status: 'Issued', poDate: ago(9), dueDate: ago(-21), // due in 21 days
    });
    await Invoice.create({
      purchaseOrderId: po8._id, invoiceDate: ago(9), dueDate: ago(-21), status: 'Sent',
    });
    await log('REQUEST_CREATED',  'Approval',      a8._id,  `New RFQ created: "Security Camera System — HQ" from SecureVision Pvt Ltd — ₹${t8.subtotal.toLocaleString('en-IN')} (Infrastructure)`, { amount: t8.subtotal }, ago(12));
    await log('APPROVAL_APPROVED','Approval',      a8._id,  `Rahul Mehta (L1) approved "Security Camera System — HQ" — forwarding to Manager.`, { approver: 'Rahul Mehta', remarks: 'Security compliance requirement.' }, ago(10));
    await log('APPROVAL_APPROVED','Approval',      a8._id,  `Priya Shah (Manager L2) approved "Security Camera System — HQ" — fully approved.`, { approver: 'Priya Shah', remarks: 'Approved as per security audit mandate.' }, ago(9));
    await log('PO_GENERATED',    'PurchaseOrder', po8._id,  `PO PO-2025-0058 generated for "Security Camera System — HQ" — Total: ₹${t8.grandTotal.toLocaleString('en-IN')} incl. GST`, { grandTotal: t8.grandTotal, poNumber: 'PO-2025-0058' }, ago(9));
    await log('INVOICE_GENERATED','Invoice',       po8._id, `Invoice generated for PO PO-2025-0058 — ₹${t8.grandTotal.toLocaleString('en-IN')} — due in 21 days`, { grandTotal: t8.grandTotal, status: 'Sent' }, ago(9));

    console.log('[Seed] ✅ 8 approvals + activity logs seeded.');

    res.json({
      success: true,
      message: '8 approvals seeded with rich activity logs. Use ?force=1 to reseed.',
      summary: {
        '#1 Office Furniture Q2':          { status: 'Pending',  step: 'L1 Pending',  grandTotal: t1.grandTotal },
        '#2 IT Hardware Upgrade Q1':       { status: 'Pending',  step: 'L2 Pending',  grandTotal: t2.grandTotal },
        '#3 Office Stationery Q2':         { status: 'Pending',  step: 'L1 Pending',  grandTotal: t3.grandTotal },
        '#4 Logistics Services Q2':        { status: 'Approved', invoice: 'Overdue',  grandTotal: t4.grandTotal },
        '#5 Server Room Cooling Unit':     { status: 'Approved', invoice: 'Paid',     grandTotal: t5.grandTotal },
        '#6 Annual Software Licensing':    { status: 'Rejected', step: 'Rejected L1', grandTotal: t6.grandTotal },
        '#7 Canteen Equipment Upgrade':    { status: 'Rejected', step: 'Rejected L2', grandTotal: t7.grandTotal },
        '#8 Security Camera System HQ':    { status: 'Approved', invoice: 'Sent',     grandTotal: t8.grandTotal },
      },
    });
  } catch (err) {
    console.error('[Seed] ❌', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};
