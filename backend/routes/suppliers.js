import express from 'express';
import {
    getSuppliers,
    getSupplierById,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    getDeletedSuppliers,
    restoreSupplier,
    getExpenseHeads,
    createExpenseHead
} from '../controllers/supplierController.js';
import { protect, admin } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

// Must be declared BEFORE /:id to avoid route shadowing
router.get('/expense-heads', protect, getExpenseHeads);
router.post('/expense-heads', protect, createExpenseHead);
router.get('/trash', protect, authorize('Admin'), getDeletedSuppliers);
router.put('/:id/restore', protect, authorize('Admin'), restoreSupplier);

router.get('/', protect, admin, getSuppliers);
router.get('/:id', protect, admin, getSupplierById);
router.post('/', protect, admin, createSupplier);
router.put('/:id', protect, admin, updateSupplier);
router.delete('/:id', protect, admin, deleteSupplier);

export default router;

