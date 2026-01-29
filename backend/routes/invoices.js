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
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, createInvoice);
router.get('/', protect, getInvoices);
router.get('/:id', protect, getInvoiceById);
router.put('/:id/payment', protect, updateInvoicePayment);
router.post('/:id/void', protect, voidInvoice);
router.delete('/:id', protect, deleteInvoice);
router.post('/:id/email', protect, emailInvoice);

export default router;
