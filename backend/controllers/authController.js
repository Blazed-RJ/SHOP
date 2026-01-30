import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { OAuth2Client } from 'google-auth-library';

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
        user.role = 'Admin'; // Enforce Admin for all public signups
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
        const { username, password } = req.body;

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
            res.json({
                _id: user._id,
                name: user.name,
                username: user.username,
                role: user.role,
                ownerId: user.ownerId,
                token: generateToken(user._id),
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
    const { token } = req.body;

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
                role: 'Admin', // Default to Admin
            });
            // Assign ownerId to self
            user.ownerId = user._id;
            await user.save();
        }

        res.json({
            _id: user._id,
            name: user.name,
            username: user.username,
            role: user.role,
            ownerId: user.ownerId,
            avatar: user.avatar,
            token: generateToken(user._id),
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

export { registerUser, authUser, googleLogin, createStaff, getStaff };
