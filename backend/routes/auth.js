import express from 'express';
import { registerUser, authUser, googleLogin, createStaff, getStaff, verifyOTP, logoutUser, resendOtp, getDevices, removeDevice } from '../controllers/authController.js';
import { protect, admin } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: 'Too many attempts, please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        const ip = req.ip || req.socket?.remoteAddress;
        return ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1';
    },
});

router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, authUser);
router.post('/logout', protect, logoutUser);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', authLimiter, resendOtp);
router.post('/google', authLimiter, googleLogin);
router.post('/staff', protect, admin, createStaff);
router.get('/staff', protect, admin, getStaff);
router.get('/devices', protect, getDevices);
router.delete('/devices/:deviceId', protect, removeDevice);

export default router;


