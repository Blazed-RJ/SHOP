import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { name, username, password, shopCode } = req.body;

    const userExists = await User.findOne({ username });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    // LOGIC: First user is Admin, OR if code matches OWNER2026
    const isFirstAccount = (await User.countDocuments({})) === 0;
    const isAdmin = isFirstAccount || shopCode === process.env.ADMIN_SECRET_CODE;

    const user = await User.create({
        name,
        username,
        password,
        role: isAdmin ? 'Admin' : 'Staff',
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            username: user.username,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = async (req, res) => {
    const { username, password } = req.body;

    // Demo Mode Bypass
    if (username === 'demo' && password === 'demo') {
        // Return a mock admin token/user for testing
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
            token: generateToken(user._id),
        });
    } else {
        res.status(401);
        throw new Error('Invalid username or password');
    }
};

// @desc    Google Login
// @route   POST /api/auth/google
// @access  Public
import { OAuth2Client } from 'google-auth-library';
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleLogin = async (req, res) => {
    const { token } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const { name, email, picture, sub } = ticket.getPayload();

        // Check if user exists (by googleId or email)
        let user = await User.findOne({
            $or: [{ googleId: sub }, { username: email }]
        });

        if (user) {
            // Update googleId if missing (linking accounts)
            if (!user.googleId) {
                user.googleId = sub;
                user.authProvider = 'google'; // or hybrid
                if (!user.avatar) user.avatar = picture;
                await user.save();
            }
        } else {
            // Create new user
            // Check if first user for admin rights
            const isFirstAccount = (await User.countDocuments({})) === 0;

            user = await User.create({
                name,
                username: email, // Use email as username for Google users
                // No password for Google users
                googleId: sub,
                authProvider: 'google',
                avatar: picture,
                role: isFirstAccount ? 'Admin' : 'Staff',
            });
        }

        res.json({
            _id: user._id,
            name: user.name,
            username: user.username,
            role: user.role,
            avatar: user.avatar,
            token: generateToken(user._id),
        });

    } catch (error) {
        res.status(401);
        throw new Error('Google authentication failed: ' + error.message);
    }
};

export { registerUser, authUser, googleLogin };
