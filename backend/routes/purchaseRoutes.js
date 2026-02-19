
import express from 'express';
import { protect } from '../middleware/auth.js';
import { createPurchase } from '../controllers/purchaseController.js';

const router = express.Router();

router.post('/', protect, createPurchase);

export default router;
