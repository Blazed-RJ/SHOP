import express from 'express';
import {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts
} from '../controllers/productController.js';
import { protect, admin } from '../middleware/auth.js';
import upload from '../config/multer.js';

const router = express.Router();

// Public routes (require authentication)
router.get('/', protect, getProducts);
router.get('/search/:keyword', protect, searchProducts);
router.get('/:id', protect, getProductById);

// Admin only routes
router.post('/', protect, admin, upload.single('image'), createProduct);
router.put('/:id', protect, admin, upload.single('image'), updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

export default router;
