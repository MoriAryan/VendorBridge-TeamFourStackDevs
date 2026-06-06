import { Router } from 'express';
import { getPurchaseOrders, getPurchaseOrderById } from '../controllers/purchaseOrder.controller.js';

const router = Router();

router.get('/',    getPurchaseOrders);
router.get('/:id', getPurchaseOrderById);

export default router;
