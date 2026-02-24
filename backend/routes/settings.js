import express from 'express';
import {
    getSettings,
    updateSettings,
    generateUPIQR,
    uploadAvatar
} from '../controllers/settingsController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import upload from '../config/multer.js';

const router = express.Router();

router.route('/')
    .get(protect, getSettings)
    .put(protect, authorize('Admin'), upload.fields([
        { name: 'logo', maxCount: 1 },
        { name: 'digitalSignature', maxCount: 1 },
        { name: 'letterhead', maxCount: 1 },
        { name: 'profilePicture', maxCount: 1 }
    ]), updateSettings);
router.post('/generate-qr', protect, generateUPIQR);
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);

export default router;
