import express from 'express';
import { registerUser, authUser, googleLogin, createStaff, getStaff, verifyOTP, logoutUser } from '../controllers/authController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', authUser);
router.post('/logout', protect, logoutUser);
router.post('/verify-otp', verifyOTP);
router.post('/google', googleLogin);
router.post('/staff', protect, admin, createStaff);
router.get('/staff', protect, admin, getStaff);

export default router;
