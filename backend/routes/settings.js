import express from 'express';
import {
    getSettings,
    updateSettings,
    generateUPIQR,
    uploadAvatar
} from '../controllers/settingsController.js';
import { protect, admin } from '../middleware/auth.js';
import upload from '../config/multer.js';

const router = express.Router();

router.get('/', getSettings); // Public route for branding/theme
router.put('/', protect, admin, upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'digitalSignature', maxCount: 1 },
    { name: 'letterhead', maxCount: 1 },
    { name: 'profilePicture', maxCount: 1 }
]), updateSettings);
router.post('/generate-qr', protect, admin, generateUPIQR);
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);

export default router;
