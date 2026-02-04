import express from 'express';
import { getLedger, recalculateLedger, getDaybook, updateLedgerEntry, deleteLedgerEntry } from '../controllers/ledgerController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/daybook', protect, getDaybook);
router.get('/:customerId', protect, getLedger);
router.post('/recalculate/:customerId', protect, recalculateLedger);
router.put('/:id', protect, updateLedgerEntry);
router.delete('/:id', protect, deleteLedgerEntry);

export default router;
