import express from 'express';
import {
    getPublicInvoice,
    getPublicCustomerLedger,
    getPublicSupplierLedger
} from '../controllers/publicController.js';

const router = express.Router();

router.get('/invoices/:id', getPublicInvoice);
router.get('/customers/:id/ledger', getPublicCustomerLedger);
router.get('/suppliers/:id/ledger', getPublicSupplierLedger);

export default router;
