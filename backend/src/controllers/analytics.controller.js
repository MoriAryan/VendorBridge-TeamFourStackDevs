import { Approval } from '../models/approval.model.js';
import { PurchaseOrder } from '../models/purchaseOrder.model.js';
import { Invoice } from '../models/invoice.model.js';

// GET /api/v1/analytics/summary
export const getAnalyticsSummary = async (req, res) => {
  try {
    const [approvals, pos, invoices] = await Promise.all([
      Approval.find().lean(),
      PurchaseOrder.find().lean(),
      Invoice.find().populate('purchaseOrderId').lean(),
    ]);

    // ── KPI cards ────────────────────────────────────────────────────────────
    const paidInvoices      = invoices.filter(i => i.status === 'Paid');
    const overdueInvoices   = invoices.filter(i => i.status === 'Overdue');
    const totalSpend        = paidInvoices.reduce((s, i) => s + (i.purchaseOrderId?.grandTotal || 0), 0);
    const committedSpend    = invoices.reduce((s, i) => s + (i.purchaseOrderId?.grandTotal || 0), 0);
    const pendingApprovals  = approvals.filter(a => a.status === 'Pending').length;
    const approvedApprovals = approvals.filter(a => a.status === 'Approved').length;
    const rejectedApprovals = approvals.filter(a => a.status === 'Rejected').length;
    const totalPos          = pos.length;
    const completedPos      = pos.filter(p => p.status === 'Completed').length;
    const poFulfillment     = totalPos > 0 ? Math.round((completedPos / totalPos) * 100) : 0;

    // ── Spend by category (Approved approvals) ───────────────────────────────
    const catMap = {};
    approvals.filter(a => a.status === 'Approved').forEach(a => {
      const cat = a.category || 'Uncategorised';
      const amt = (a.lineItems || []).reduce((s, li) => s + (li.qty * li.unitPrice), 0);
      catMap[cat] = (catMap[cat] || 0) + amt;
    });
    const spendByCategory = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => ({ category, amount }));

    // ── Invoice status distribution ──────────────────────────────────────────
    const invStatusMap = { Generated: 0, Sent: 0, Paid: 0, Overdue: 0 };
    invoices.forEach(i => { if (invStatusMap[i.status] !== undefined) invStatusMap[i.status]++; });
    const invoiceStatusDist = Object.entries(invStatusMap).map(([status, count]) => ({ status, count }));

    // ── Top vendors by spend (from POs via Invoices) ─────────────────────────
    const vendorMap = {};
    invoices.forEach(inv => {
      const po = inv.purchaseOrderId;
      if (!po) return;
      const name = po.vendor?.name || 'Unknown';
      if (!vendorMap[name]) vendorMap[name] = { vendor: name, spend: 0, pos: 0, gstin: po.vendor?.gstin || '' };
      vendorMap[name].spend += po.grandTotal || 0;
      vendorMap[name].pos   += 1;
    });
    const topVendors = Object.values(vendorMap).sort((a, b) => b.spend - a.spend).slice(0, 6);

    // ── Monthly spend trend — last 6 months ──────────────────────────────────
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ label: d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }), year: d.getFullYear(), month: d.getMonth(), amount: 0, count: 0 });
    }
    invoices.forEach(inv => {
      const po = inv.purchaseOrderId;
      if (!po?.poDate) return;
      const d    = new Date(po.poDate);
      const slot = months.find(m => m.year === d.getFullYear() && m.month === d.getMonth());
      if (slot) { slot.amount += po.grandTotal || 0; slot.count += 1; }
    });
    const monthlyTrend = months.map(({ label, amount, count }) => ({ label, amount, count }));

    // ── Approval cycle time (avg days from submission to final decision) ──────
    let totalDays = 0; let cycleCount = 0;
    approvals.filter(a => a.status !== 'Pending').forEach(a => {
      const chain    = a.chain || [];
      const lastStep = chain.filter(s => s.timestamp).sort((x, y) => new Date(y.timestamp) - new Date(x.timestamp))[0];
      if (lastStep?.timestamp && a.createdAt) {
        const diff = (new Date(lastStep.timestamp) - new Date(a.createdAt)) / 86400000;
        if (diff >= 0) { totalDays += diff; cycleCount++; }
      }
    });
    const avgCycleDays = cycleCount > 0 ? +(totalDays / cycleCount).toFixed(1) : 0;

    // ── Approval rate ────────────────────────────────────────────────────────
    const decidedTotal = approvedApprovals + rejectedApprovals;
    const approvalRate = decidedTotal > 0 ? Math.round((approvedApprovals / decidedTotal) * 100) : 0;

    // ── Recent POs (for dashboard table) ─────────────────────────────────────
    const recentPOs = await PurchaseOrder.find()
      .sort({ createdAt: -1 }).limit(5).lean();

    // ── Recent approvals (for dashboard feed) ────────────────────────────────
    const recentApprovals = await Approval.find()
      .sort({ createdAt: -1 }).limit(5).lean();

    res.json({
      success: true,
      data: {
        kpis: {
          totalSpend, committedSpend,
          pendingApprovals, approvedApprovals, rejectedApprovals,
          overdueInvoices: overdueInvoices.length,
          paidInvoices:    paidInvoices.length,
          poFulfillment, totalPos, completedPos,
          avgCycleDays, approvalRate,
          totalApprovals: approvals.length,
        },
        spendByCategory,
        invoiceStatusDist,
        topVendors,
        monthlyTrend,
        pipeline: { pending: pendingApprovals, approved: approvedApprovals, rejected: rejectedApprovals },
        recentPOs,
        recentApprovals,
      },
    });
  } catch (err) {
    console.error('[Analytics]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};
