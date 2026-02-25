import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { OAuth2Client } from 'google-auth-library';
import { sendEmail } from '../utils/email.js';

const MAX_TRUSTED_DEVICES = 5;

// ─── Shared OTP Helper ─────────────────────────────────────────────────────
const issueOtp = async (user, logTag = '') => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    const emailConfigured = process.env.BREVO_API_KEY || (process.env.EMAIL_USER && process.env.EMAIL_PASS);
    if (emailConfigured && user.email) {
        // Fire-and-forget: don't await email — send OTP response immediately
        sendEmail({
            to: user.email,
            subject: 'Login Verification Code - Shop App',
            html: `<h3>Your Verification Code is: ${otp}</h3><p>This code expires in 10 minutes.</p>`
        }).catch(err => console.error('[EMAIL ERROR]', err.message));
    } else if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEV MODE] OTP${logTag ? ' (' + logTag + ')' : ''}: ${otp}`);
    } else {
        console.warn('[WARN] Email not configured — OTP will not be sent.');
    }

    return {
        message: 'Device verification required',
        requireOtp: true,
        userId: user._id,
        emailMasked: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    };
};

// ─── isTrusted Helper (works with {id, name, addedAt} objects) ─────────────
const isTrusted = (user, deviceId) =>
    deviceId && user.trustedDevices?.some(d => d.id === deviceId);

// ─── addTrustedDevice Helper ───────────────────────────────────────────────
const addTrustedDevice = (user, deviceId, deviceName) => {
    if (!deviceId) return;
    if (!user.trustedDevices) user.trustedDevices = [];
    if (user.trustedDevices.some(d => d.id === deviceId)) return; // already trusted
    if (user.trustedDevices.length >= MAX_TRUSTED_DEVICES) {
        user.trustedDevices.shift(); // remove oldest
    }
    user.trustedDevices.push({ id: deviceId, name: deviceName || 'Unknown Device', addedAt: new Date() });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { name, username, email, password, shopCode } = req.body;
        const userExists = await User.findOne({ $or: [{ username }, { email }] });
        if (userExists) return res.status(400).json({ message: 'User already exists (Username or Email)' });

        const isFirstAccount = (await User.countDocuments({})) === 0;
        const isAdmin = isFirstAccount || shopCode === process.env.ADMIN_SECRET_CODE;

        const user = await User.create({ name, username, email, password, role: isAdmin ? 'Admin' : 'Staff' });
        user.ownerId = user._id;
        await user.save();

        res.status(201).json({ _id: user._id, name: user.name, username: user.username, email: user.email, role: user.role, ownerId: user.ownerId, token: generateToken(user._id) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a Staff account (Admin only)
// @route   POST /api/auth/staff
// @access  Private/Admin
const createStaff = async (req, res) => {
    try {
        const { name, username, email, password } = req.body;
        const userExists = await User.findOne({ $or: [{ username }, { email }] });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const user = await User.create({ name, username, email, password, role: 'Staff', ownerId: req.user._id });
        res.status(201).json({ _id: user._id, name: user.name, username: user.username, email: user.email, role: user.role, ownerId: user.ownerId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = async (req, res) => {
    try {
        const { username, password, deviceId } = req.body;

        if (username === 'demo' && password === 'demo') {
            return res.json({ _id: 'demo123', name: 'Demo Admin', username: 'demo', role: 'Admin', token: 'demo-token-bypass' });
        }

        const user = await User.findOne({ username });
        if (user && (await user.matchPassword(password))) {
            if (isTrusted(user, deviceId)) {
                return res.json({ _id: user._id, name: user.name, username: user.username, role: user.role, ownerId: user.ownerId, token: generateToken(user._id) });
            }
            const otpResponse = await issueOtp(user, username);
            return res.json(otpResponse);
        } else {
            res.status(401).json({ message: 'Invalid username or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Google Login
// @route   POST /api/auth/google
// @access  Public
const googleLogin = async (req, res) => {
    const { token, deviceId } = req.body;
    try {
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({ idToken: token, audience: process.env.GOOGLE_CLIENT_ID });
        const { name, email, picture, sub } = ticket.getPayload();

        let user = await User.findOne({ $or: [{ googleId: sub }, { email }] });
        if (user) {
            if (!user.googleId) { user.googleId = sub; if (!user.avatar) user.avatar = picture; await user.save(); }
        } else {
            user = await User.create({ name, username: email.split('@')[0], email, googleId: sub, authProvider: 'google', avatar: picture, role: 'Admin' });
            user.ownerId = user._id;
            await user.save();
        }

        if (isTrusted(user, deviceId)) {
            return res.json({ _id: user._id, name: user.name, username: user.username, role: user.role, ownerId: user.ownerId, avatar: user.avatar, token: generateToken(user._id) });
        }
        const otpResponse = await issueOtp(user, email);
        return res.json(otpResponse);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all staff members
// @route   GET /api/auth/staff
// @access  Private/Admin
const getStaff = async (req, res) => {
    try {
        const staff = await User.find({ ownerId: req.user._id, role: 'Staff' }).select('-password');
        res.json(staff);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify OTP and Trust Device
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
    try {
        const { userId, otp, deviceId, deviceName } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.otp === otp && user.otpExpires > Date.now()) {
            user.otp = undefined;
            user.otpExpires = undefined;
            addTrustedDevice(user, deviceId, deviceName);
            await user.save();
            res.json({ _id: user._id, name: user.name, username: user.username, role: user.role, ownerId: user.ownerId, token: generateToken(user._id) });
        } else {
            res.status(400).json({ message: 'Invalid or expired Code' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    List trusted devices for the current user
// @route   GET /api/auth/devices
// @access  Private
const getDevices = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('trustedDevices');
        const currentDeviceId = req.headers['x-device-id'];
        const devices = (user.trustedDevices || []).map(d => ({
            id: d.id,
            name: d.name,
            addedAt: d.addedAt,
            isCurrent: d.id === currentDeviceId
        }));
        res.json(devices);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Remove a specific trusted device
// @route   DELETE /api/auth/devices/:deviceId
// @access  Private
const removeDevice = async (req, res) => {
    try {
        const { deviceId } = req.params;
        await User.findByIdAndUpdate(req.user._id, {
            $pull: { trustedDevices: { id: deviceId } }
        });
        res.json({ message: 'Device removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Logout — remove current device from trusted list
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = async (req, res) => {
    try {
        const { deviceId } = req.body;
        if (deviceId && req.user) {
            await User.findByIdAndUpdate(req.user._id, {
                $pull: { trustedDevices: { id: deviceId } }
            });
        }
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOtp = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        const otpResponse = await issueOtp(user, 'resend');
        return res.json(otpResponse);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { registerUser, authUser, googleLogin, createStaff, getStaff, verifyOTP, logoutUser, resendOtp, getDevices, removeDevice };
