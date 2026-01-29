import express from 'express';
import {
    createLetterhead,
    getLetterheads,
    getLetterheadById,
    updateLetterhead,
    deleteLetterhead
} from '../controllers/letterheadController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
    .post(protect, createLetterhead)
    .get(protect, getLetterheads);

router.route('/:id')
    .get(protect, getLetterheadById)
    .put(protect, updateLetterhead)
    .delete(protect, deleteLetterhead);

export default router;
