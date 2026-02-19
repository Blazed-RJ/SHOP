import express from 'express';
import {
    createInvoice,
    getInvoices,
    getInvoiceById,
    updateInvoicePayment,
    deleteInvoice,
    voidInvoice,
    emailInvoice
} from '../controllers/invoiceController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

router.post('/', protect, createInvoice);
router.get('/', protect, getInvoices);
router.get('/:id', protect, getInvoiceById);
router.put('/:id/payment', protect, authorize('Admin', 'Accountant'), updateInvoicePayment);
router.post('/:id/void', protect, authorize('Admin', 'Accountant'), voidInvoice);
router.delete('/:id', protect, authorize('Admin'), deleteInvoice);
router.post('/:id/email', protect, emailInvoice);

export default router;
