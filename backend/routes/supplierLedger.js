import express from 'express';
import { getSupplierLedger, recalculateSupplierLedger, recordPurchase, updateLedgerEntry, deleteLedgerEntry } from '../controllers/supplierLedgerController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.get('/:supplierId', protect, getSupplierLedger);
router.post('/recalculate/:supplierId', protect, recalculateSupplierLedger);
router.post('/record-purchase', protect, upload.single('billFile'), recordPurchase);
router.put('/:id', protect, updateLedgerEntry);
router.delete('/:id', protect, deleteLedgerEntry);

export default router;
