import express from 'express';
import {
    getCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    getCustomersWithDues,
    deleteCustomer,
    getDeletedCustomers,
    restoreCustomer,
    hardDeleteCustomer
} from '../controllers/customerController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

router.get('/', protect, getCustomers);
router.get('/dues', protect, getCustomersWithDues);
router.get('/trash', protect, authorize('Admin'), getDeletedCustomers);
router.put('/:id/restore', protect, authorize('Admin'), restoreCustomer);
router.delete('/:id/hard-delete', protect, authorize('Admin'), hardDeleteCustomer);
router.get('/:id', protect, getCustomerById);
router.post('/', protect, createCustomer);
router.put('/:id', protect, updateCustomer);
router.delete('/:id', protect, authorize('Admin', 'Accountant'), deleteCustomer);

export default router;
