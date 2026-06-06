import { Router } from 'express';
import { getInvoices, getInvoiceById, markInvoicePaid } from '../controllers/invoice.controller.js';

const router = Router();

router.get('/',              getInvoices);
router.get('/:id',           getInvoiceById);
router.patch('/:id/mark-paid', markInvoicePaid);

export default router;
