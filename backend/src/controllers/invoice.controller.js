import { Invoice } from '../models/invoice.model.js';
import { PurchaseOrder } from '../models/purchaseOrder.model.js';

// GET /api/v1/invoices
// Returns all invoices with purchaseOrderId fully populated (vendor, billTo, lineItems, totals)
export const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .sort({ createdAt: -1 })
      .populate('purchaseOrderId');          // full PO for list panel (vendor, grandTotal)
    res.json({ success: true, data: invoices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/invoices/:id
// Returns invoice + fully populated PO (including nested approvalId) in one response
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate({
      path:     'purchaseOrderId',
      populate: { path: 'approvalId', select: 'rfqTitle vendor deliveryDays' },
    });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    // Return invoice and po as siblings so the frontend never needs a second fetch
    const po = invoice.purchaseOrderId;
    res.json({ success: true, data: { invoice, po } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/v1/invoices/:id/mark-paid
export const markInvoicePaid = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    if (invoice.status === 'Paid') return res.status(400).json({ success: false, message: 'Invoice already paid.' });

    invoice.status = 'Paid';
    invoice.paidAt = new Date();
    await invoice.save();

    await PurchaseOrder.findByIdAndUpdate(invoice.purchaseOrderId, { status: 'Completed' });

    console.log(`[Activity] Invoice ${invoice._id} marked as Paid.`);
    res.json({ success: true, data: invoice, message: 'Invoice marked as Paid.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
