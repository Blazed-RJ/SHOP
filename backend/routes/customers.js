import express from 'express';
import {
    getCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    getCustomersWithDues,
    deleteCustomer
} from '../controllers/customerController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getCustomers);
router.get('/dues', protect, getCustomersWithDues);
router.get('/:id', protect, getCustomerById);
router.post('/', protect, createCustomer);
router.put('/:id', protect, updateCustomer);
router.delete('/:id', protect, deleteCustomer);

export default router;
