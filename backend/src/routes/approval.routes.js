import { Router } from 'express';
import { getApprovals, getApprovalById, approveStep, rejectApproval, createApproval } from '../controllers/approval.controller.js';

const router = Router();

router.post('/',          createApproval);
router.get('/',           getApprovals);
router.get('/:id',        getApprovalById);
router.patch('/:id/approve', approveStep);
router.patch('/:id/reject',  rejectApproval);

export default router;
