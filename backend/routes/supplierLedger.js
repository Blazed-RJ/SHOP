import express from 'express';
import { getSupplierLedger, recalculateSupplierLedger, recordPurchase } from '../controllers/supplierLedgerController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.get('/:supplierId', protect, getSupplierLedger);
router.post('/recalculate/:supplierId', protect, recalculateSupplierLedger);
router.post('/record-purchase', protect, upload.single('billFile'), recordPurchase);

export default router;
