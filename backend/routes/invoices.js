import express from 'express';
import {
    createInvoice,
    getInvoices,
    getInvoiceById,
    updateInvoicePayment,
    deleteInvoice,
    voidInvoice,
    emailInvoice,
    getDeletedInvoices,
    restoreInvoice
} from '../controllers/invoiceController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

router.post('/', protect, createInvoice);
router.get('/trash', protect, authorize('Admin'), getDeletedInvoices);
router.put('/:id/restore', protect, authorize('Admin'), restoreInvoice);
router.get('/', protect, getInvoices);
router.get('/:id', protect, getInvoiceById);
router.put('/:id/payment', protect, authorize('Admin', 'Accountant'), updateInvoicePayment);
router.post('/:id/void', protect, authorize('Admin', 'Accountant'), voidInvoice);
router.delete('/:id', protect, authorize('Admin'), deleteInvoice);
router.post('/:id/email', protect, emailInvoice);

export default router;
