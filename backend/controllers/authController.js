import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { OAuth2Client } from 'google-auth-library';
import { sendEmail } from '../utils/email.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { name, username, email, password, shopCode } = req.body;

        const userExists = await User.findOne({ $or: [{ username }, { email }] });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists (Username or Email)' });
        }

        // LOGIC: First user is Admin, OR if code matches OWNER2026
        const isFirstAccount = (await User.countDocuments({})) === 0;
        const isAdmin = isFirstAccount || shopCode === process.env.ADMIN_SECRET_CODE;

        const user = await User.create({
            name,
            username,
            email,
            password,
            role: isAdmin ? 'Admin' : 'Staff',
        });

        // We update the user immediately to set ownerId = _id (since _id is generated on create)
        user.ownerId = user._id;
        await user.save();

        res.status(201).json({
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            role: user.role,
            ownerId: user.ownerId, // Send ownerId
            token: generateToken(user._id),
        });

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

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create staff linked to the current Admin
        const user = await User.create({
            name,
            username,
            email,
            password,
            role: 'Staff',
            ownerId: req.user._id, // Link to the creator (Admin)
        });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            role: user.role,
            ownerId: user.ownerId
        });
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

        // Demo Mode Bypass
        if (username === 'demo' && password === 'demo') {
            return res.json({
                _id: 'demo123',
                name: 'Demo Admin',
                username: 'demo',
                role: 'Admin',
                token: 'demo-token-bypass'
            });
        }

        const user = await User.findOne({ username });

        if (user && (await user.matchPassword(password))) {
            // Demo Bypass
            if (user._id === 'demo123') {
                return res.json({
                    _id: user._id,
                    name: user.name,
                    username: user.username,
                    role: user.role,
                    ownerId: user.ownerId,
                    token: generateToken(user._id),
                });
            }

            // Skip OTP if device is trusted (cleared on logout)
            if (deviceId && user.trustedDevices && user.trustedDevices.includes(deviceId)) {
                return res.json({
                    _id: user._id,
                    name: user.name,
                    username: user.username,
                    role: user.role,
                    ownerId: user.ownerId,
                    token: generateToken(user._id),
                });
            }

            // Not trusted — generate OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            // OTP Expires in 10 minutes
            const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

            user.otp = otp;
            user.otpExpires = otpExpires;
            await user.save();

            // Send OTP Email
            const emailConfigured = process.env.EMAIL_USER && process.env.EMAIL_PASS;

            if (emailConfigured && user.email) {
                try {
                    await sendEmail({
                        to: user.email,
                        subject: 'Login Verification Code - Shop App',
                        html: `<h3>Your Verification Code is: ${otp}</h3><p>This code expires in 10 minutes.</p>`
                    });
                } catch (emailError) {
                    console.error("Failed to send OTP email", emailError);
                    return res.status(500).json({ message: 'Failed to send verification email' });
                }
            } else if (process.env.NODE_ENV !== 'production') {
                console.log(`[DEV MODE] OTP for ${username}: ${otp}`);
            } else {
                return res.status(500).json({ message: 'Email configuration missing on server.' });
            }

            return res.json({
                message: 'Device verification required',
                requireOtp: true,
                userId: user._id,
                emailMasked: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
            });

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
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const { name, email, picture, sub } = ticket.getPayload();

        let user = await User.findOne({
            $or: [{ googleId: sub }, { email: email }]
        });

        if (user) {
            if (!user.googleId) {
                user.googleId = sub;
                if (!user.avatar) user.avatar = picture;
                await user.save();
            }
        } else {
            // New Google User -> Admin/Owner
            user = await User.create({
                name,
                username: email.split('@')[0],
                email,
                googleId: sub,
                authProvider: 'google',
                avatar: picture,
                role: 'Admin',
            });
            user.ownerId = user._id;
            await user.save();
        }

        // Skip OTP if device is trusted (cleared on logout)
        if (deviceId && user.trustedDevices && user.trustedDevices.includes(deviceId)) {
            return res.json({
                _id: user._id,
                name: user.name,
                username: user.username,
                role: user.role,
                ownerId: user.ownerId,
                avatar: user.avatar,
                token: generateToken(user._id),
            });
        }

        // Not trusted — generate and send OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();

        const emailConfigured = process.env.EMAIL_USER && process.env.EMAIL_PASS;
        if (emailConfigured && user.email) {
            try {
                await sendEmail({
                    to: user.email,
                    subject: 'Login Verification Code - Shop App',
                    html: `<h3>Your Verification Code is: ${otp}</h3><p>This code expires in 10 minutes.</p>`
                });
            } catch (emailError) {
                console.error('Failed to send OTP email', emailError);
                return res.status(500).json({ message: 'Failed to send verification email' });
            }
        } else if (process.env.NODE_ENV !== 'production') {
            console.log(`[DEV MODE] Google OTP for ${email}: ${otp}`);
        } else {
            return res.status(500).json({ message: 'Email configuration missing on server.' });
        }

        return res.json({
            message: 'Device verification required',
            requireOtp: true,
            userId: user._id,
            emailMasked: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
        });

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
        const { userId, otp, deviceId } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.otp === otp && user.otpExpires > Date.now()) {
            // Success
            user.otp = undefined;
            user.otpExpires = undefined;

            // Add Device to Trusted List
            if (deviceId && (!user.trustedDevices || !user.trustedDevices.includes(deviceId))) {
                if (!user.trustedDevices) user.trustedDevices = [];
                user.trustedDevices.push(deviceId);
            }

            await user.save();

            res.json({
                _id: user._id,
                name: user.name,
                username: user.username,
                role: user.role,
                ownerId: user.ownerId,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid or expired Code' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Logout — remove device from trusted list so next login requires OTP
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = async (req, res) => {
    try {
        const { deviceId } = req.body;
        if (deviceId && req.user) {
            await User.findByIdAndUpdate(req.user._id, {
                $pull: { trustedDevices: deviceId }
            });
        }
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { registerUser, authUser, googleLogin, createStaff, getStaff, verifyOTP, logoutUser };
