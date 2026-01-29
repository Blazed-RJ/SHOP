import express from 'express';
import { getLedger, recalculateLedger, getDaybook } from '../controllers/ledgerController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/daybook', protect, getDaybook);
router.get('/:customerId', protect, getLedger);
router.post('/recalculate/:customerId', protect, recalculateLedger);

export default router;
