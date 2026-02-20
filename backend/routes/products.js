import express from 'express';
import {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
    getProductBatches,
    getExpiringBatches,
    createProductsBulk
} from '../controllers/productController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import upload from '../config/multer.js';

const router = express.Router();

// Public routes (require authentication)
router.get('/', protect, getProducts);
router.get('/expiry-alert', protect, getExpiringBatches);
router.get('/search/:keyword', protect, searchProducts);
router.get('/:id', protect, getProductById);
router.get('/:id/batches', protect, getProductBatches);

// Admin only routes
// Admin & Accountant routes
router.post('/bulk', protect, authorize('Admin', 'Accountant'), createProductsBulk);
router.post('/', protect, authorize('Admin', 'Accountant'), upload.single('image'), createProduct);
router.put('/:id', protect, authorize('Admin', 'Accountant'), upload.single('image'), updateProduct);
router.delete('/:id', protect, authorize('Admin'), deleteProduct);

export default router;
