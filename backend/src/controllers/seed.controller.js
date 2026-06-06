import { Approval } from '../models/approval.model.js';
import { PurchaseOrder } from '../models/purchaseOrder.model.js';
import { Invoice } from '../models/invoice.model.js';

// ── Pure helper: compute line item totals deterministically ──────────────────
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

// Standard 2-step chain — ALWAYS these exact two roles, no variations
const L1 = (status = 'pending', remarks = '', ts = null) => ({
  name: 'Rahul Mehta', role: 'Procurement Head (L1)', initials: 'RM',
  status, remarks, timestamp: ts,
});
const L2 = (status = 'pending', remarks = '', ts = null) => ({
  name: 'Priya Shah', role: 'Manager (L2)', initials: 'PS',
  status, remarks, timestamp: ts,
});

// GET /api/v1/seed          — seed if DB empty
// GET /api/v1/seed?force=1  — drop ALL data & reseed
export const seedData = async (req, res) => {
  try {
    if (req.query.force === '1') {
      await Promise.all([
        Approval.deleteMany({}),
        PurchaseOrder.deleteMany({}),
        Invoice.deleteMany({}),
      ]);
    } else {
      const exists = await Approval.findOne();
      if (exists) {
        return res.json({
          success: true,
          message: 'Already seeded. Use ?force=1 to reseed.',
          alreadySeeded: true,
        });
      }
    }

    // ══════════════════════════════════════════════════════════════════════
    //  APPROVAL #1 — Office Furniture Q2
    //  Status  : Pending
    //  Step    : 0 → L1 (Rahul) has NOT approved yet
    //  Flow    : Rahul ➜ Priya
    //  Amount  : subtotal computed from actual line items (no manual override)
    // ══════════════════════════════════════════════════════════════════════
    const raw1 = [
      { item: 'Ergonomic Chair', qty: 25, unitPrice: 4500 },
      { item: 'Standing Desk',   qty: 10, unitPrice: 5700 },
    ];
    const t1 = build(raw1);
    await Approval.create({
      rfqTitle:        'Office Furniture Q2',
      vendor:          { name: 'Infra Supplies PVT LTD', address: '302, Industrial Zone, Sector 45, Gurgaon, Haryana - 122003', gstin: '06AADCI9876K2Z8' },
      quotationAmount: t1.subtotal,    // ← exact subtotal, no manual value
      deliveryDays:    10,
      vendorRating:    4.5,
      category:        'Furniture',
      lineItems:       t1.lineItems,
      status:          'Pending',
      currentStep:     0,
      chain: [
        L1(),          // pending — first action needed
        L2(),          // pending — waits for L1 to pass
      ],
    });

    // ══════════════════════════════════════════════════════════════════════
    //  APPROVAL #2 — IT Hardware Upgrade Q1 (HIGH VALUE ~ 10 lac+)
    //  Status  : Pending
    //  Step    : 1 → L1 (Rahul) DONE, now waiting for L2 (Priya — Manager)
    //  Flow    : Rahul ✓ ➾ Priya (pending)
    //  This is the 10-lac bill the user is referencing
    // ══════════════════════════════════════════════════════════════════════
    const raw2 = [
      { item: 'Laptop (Dell Latitude 5540)', qty: 12, unitPrice: 78000 },
      { item: 'USB-C Docking Station',       qty: 12, unitPrice: 6500  },
      { item: 'Mechanical Keyboard',         qty: 12, unitPrice: 4200  },
    ];
    const t2 = build(raw2);
    await Approval.create({
      rfqTitle:        'IT Hardware Upgrade Q1',
      vendor:          { name: 'TechCore LTD', address: 'Unit 5, MIDC, Andheri East, Mumbai - 400093', gstin: '27AABCT4567J1ZX' },
      quotationAmount: t2.subtotal,    // 12 * 78000 + 12 * 6500 + 12 * 4200 = 10,64,400
      deliveryDays:    7,
      vendorRating:    4.2,
      category:        'IT Hardware',
      lineItems:       t2.lineItems,
      status:          'Pending',
      currentStep:     1,             // L1 done, L2 pending
      chain: [
        L1('approved', 'Specs verified against budget allocation. Forwarding to Manager.', new Date('2025-06-05T09:00:00')),
        L2(),
      ],
    });

    // ══════════════════════════════════════════════════════════════════════
    //  APPROVAL #3 — Office Stationery Q2
    //  Status  : Pending
    //  Step    : 0 → L1 (Rahul) has NOT approved yet
    //  FIXED   : NOW 2-step chain (was incorrectly single-step before)
    // ══════════════════════════════════════════════════════════════════════
    const raw3 = [
      { item: 'A4 Ream (500 sheets)',   qty: 50, unitPrice: 280 },
      { item: 'Whiteboard Marker Set',  qty: 30, unitPrice: 220 },
      { item: 'Sticky Notes (12 pack)', qty: 40, unitPrice: 180 },
      { item: 'File Folders (Box 100)', qty: 20, unitPrice: 350 },
    ];
    const t3 = build(raw3);
    await Approval.create({
      rfqTitle:        'Office Stationery Q2',
      vendor:          { name: 'Office Needs Co.', address: '12, Market Road, Connaught Place, New Delhi - 110001', gstin: '07AABOF3210Q1ZR' },
      quotationAmount: t3.subtotal,   // 50*280 + 30*220 + 40*180 + 20*350 = 34,800
      deliveryDays:    2,
      vendorRating:    4.0,
      category:        'Stationery',
      lineItems:       t3.lineItems,
      status:          'Pending',
      currentStep:     0,
      chain: [
        L1(),           // Rahul must approve first
        L2(),           // Priya must then approve
      ],
    });

    // ══════════════════════════════════════════════════════════════════════
    //  APPROVAL #4 — Logistics Services Q2 (APPROVED → PO Issued, Invoice OVERDUE)
    //  Both L1 + L2 approved; PO and Invoice auto-created with past due date
    // ══════════════════════════════════════════════════════════════════════
    const raw4 = [
      { item: 'Monthly Logistics Contract (3 months)', qty: 3, unitPrice: 31500 },
    ];
    const t4 = build(raw4);
    const a4 = await Approval.create({
      rfqTitle:        'Logistics Services — Q2 Contract',
      vendor:          { name: 'FastLog Transport', address: 'Plot 18, Transport Nagar, Pune - 411019', gstin: '27AABFL7890P1ZY' },
      quotationAmount: t4.subtotal,  // 3 * 31500 = 94,500
      deliveryDays:    3,
      vendorRating:    3.8,
      category:        'Logistics',
      lineItems:       t4.lineItems,
      status:          'Approved',
      currentStep:     1,
      chain: [
        L1('approved', 'Budget allocated — proceed.', new Date('2025-03-15T09:00:00')),
        L2('approved', 'Vendor vetted. Approved.', new Date('2025-03-15T11:30:00')),
      ],
    });
    const po4 = await PurchaseOrder.create({
      poNumber: 'PO-2025-0029', approvalId: a4._id, billTo: BILL_TO, vendor: a4.vendor,
      lineItems:  t4.lineItems,
      subtotal:   t4.subtotal,
      cgst:       t4.cgst,
      sgst:       t4.sgst,
      grandTotal: t4.grandTotal,
      status:  'Issued',
      poDate:  new Date('2025-03-16'),
      dueDate: new Date('2025-04-16'),  // past → overdue
    });
    await Invoice.create({
      purchaseOrderId: po4._id,
      invoiceDate:     new Date('2025-03-16'),
      dueDate:         new Date('2025-04-16'),
      status:          'Overdue',
    });

    // ══════════════════════════════════════════════════════════════════════
    //  APPROVAL #5 — Server Room Cooling Unit (APPROVED → PO Completed, Invoice PAID)
    //  Both L1 + L2 approved; already paid — shows full history
    // ══════════════════════════════════════════════════════════════════════
    const raw5 = [
      { item: 'Precision Cooling Unit (5-ton)', qty: 2, unitPrice: 145000 },
      { item: 'Installation & Commissioning',  qty: 1, unitPrice: 52000  },
    ];
    const t5 = build(raw5);
    const a5 = await Approval.create({
      rfqTitle:        'Server Room Cooling Unit',
      vendor:          { name: 'CoolTech Systems', address: 'B-12, Electronics City, Bengaluru - 560100', gstin: '29AAACT5678K1ZM' },
      quotationAmount: t5.subtotal,  // 2*145000 + 1*52000 = 342,000
      deliveryDays:    14,
      vendorRating:    4.7,
      category:        'Infrastructure',
      lineItems:       t5.lineItems,
      status:          'Approved',
      currentStep:     1,
      chain: [
        L1('approved', 'Vendor approved, meets specs.', new Date('2025-04-10T09:00:00')),
        L2('approved', 'Aligned with infra roadmap.', new Date('2025-04-11T14:00:00')),
      ],
    });
    const po5 = await PurchaseOrder.create({
      poNumber: 'PO-2025-0041', approvalId: a5._id, billTo: BILL_TO, vendor: a5.vendor,
      lineItems:  t5.lineItems,
      subtotal:   t5.subtotal,
      cgst:       t5.cgst,
      sgst:       t5.sgst,
      grandTotal: t5.grandTotal,
      status:  'Completed',
      poDate:  new Date('2025-04-12'),
      dueDate: new Date('2025-05-12'),
    });
    await Invoice.create({
      purchaseOrderId: po5._id,
      invoiceDate:     new Date('2025-04-12'),
      dueDate:         new Date('2025-05-12'),
      status:          'Paid',
      paidAt:          new Date('2025-05-08'),
    });

    // ── Verify amounts printed for debugging ──────────────────────────────
    console.log('[Seed] ✅ Done');
    console.log(`  #1 Office Furniture   : subtotal=${t1.subtotal.toLocaleString('en-IN')}  grandTotal=${t1.grandTotal.toLocaleString('en-IN')}`);
    console.log(`  #2 IT Hardware        : subtotal=${t2.subtotal.toLocaleString('en-IN')}  grandTotal=${t2.grandTotal.toLocaleString('en-IN')}`);
    console.log(`  #3 Office Stationery  : subtotal=${t3.subtotal.toLocaleString('en-IN')}  grandTotal=${t3.grandTotal.toLocaleString('en-IN')}`);
    console.log(`  #4 Logistics (PO+Inv) : subtotal=${t4.subtotal.toLocaleString('en-IN')}  grandTotal=${t4.grandTotal.toLocaleString('en-IN')}`);
    console.log(`  #5 Server Room (PO+Inv): subtotal=${t5.subtotal.toLocaleString('en-IN')}  grandTotal=${t5.grandTotal.toLocaleString('en-IN')}`);

    res.json({
      success: true,
      message: '5 approvals seeded (3 Pending, 2 Approved with PO+Invoice). All 2-step chains. All amounts consistent.',
      summary: {
        'Office Furniture Q2':        { status: 'Pending', currentStep: 0, nextApprover: 'Rahul Mehta (L1)', subtotal: t1.subtotal, grandTotal: t1.grandTotal },
        'IT Hardware Upgrade Q1':     { status: 'Pending', currentStep: 1, nextApprover: 'Priya Shah (Manager L2)', subtotal: t2.subtotal, grandTotal: t2.grandTotal },
        'Office Stationery Q2':       { status: 'Pending', currentStep: 0, nextApprover: 'Rahul Mehta (L1)', subtotal: t3.subtotal, grandTotal: t3.grandTotal },
        'Logistics Services Q2':      { status: 'Approved', invoice: 'Overdue', subtotal: t4.subtotal, grandTotal: t4.grandTotal },
        'Server Room Cooling Unit':   { status: 'Approved', invoice: 'Paid',    subtotal: t5.subtotal, grandTotal: t5.grandTotal },
      },
    });
  } catch (err) {
    console.error('[Seed] ❌', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};
