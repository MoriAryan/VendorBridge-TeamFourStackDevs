import { PurchaseOrder } from '../models/purchaseOrder.model.js';
import { Invoice } from '../models/invoice.model.js';

// GET /api/v1/purchase-orders
export const getPurchaseOrders = async (req, res) => {
  try {
    const pos = await PurchaseOrder.find().sort({ createdAt: -1 }).populate('approvalId', 'rfqTitle vendor');
    res.json({ success: true, data: pos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/purchase-orders/:id  (includes its invoice)
export const getPurchaseOrderById = async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id).populate('approvalId', 'rfqTitle vendor');
    if (!po) return res.status(404).json({ success: false, message: 'PO not found' });

    const invoice = await Invoice.findOne({ purchaseOrderId: po._id });
    res.json({ success: true, data: { po, invoice } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
