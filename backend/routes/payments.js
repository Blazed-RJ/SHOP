import express from 'express';
import { recordPayment, recordSupplierPayment, recordExpense, deletePayment } from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, recordPayment);
router.post('/supplier', protect, recordSupplierPayment);
router.post('/expense', protect, recordExpense);
router.delete('/:id', protect, deletePayment);

export default router;
