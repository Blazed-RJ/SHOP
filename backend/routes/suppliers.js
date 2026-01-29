import express from 'express';
import {
    getSuppliers,
    getSupplierById,
    createSupplier,
    updateSupplier,
    deleteSupplier
} from '../controllers/supplierController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Admin only routes
router.get('/', protect, admin, getSuppliers);
router.get('/:id', protect, admin, getSupplierById);
router.post('/', protect, admin, createSupplier);
router.put('/:id', protect, admin, updateSupplier);
router.delete('/:id', protect, admin, deleteSupplier);

export default router;
