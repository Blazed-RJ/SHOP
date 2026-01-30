import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { name, username, email, password, shopCode } = req.body;

    const userExists = await User.findOne({ $or: [{ username }, { email }] });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists (Username or Email)');
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

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
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
            $or: [{ googleId: sub }, { email: email }]
        });

        if (user) {
            // Update googleId if missing (linking accounts)
            if (!user.googleId) {
                user.googleId = sub;
                // Don't overwrite authProvider if it was local, maybe just allow both? 
                // For now, let's keep it simple. If we link, we allow Google login.
                // We might want to store 'google' in an array of providers if we were complex, but this simple link is fine.
                // user.authProvider = 'google'; // Optional: keep as local if they registered manually
                if (!user.avatar) user.avatar = picture;
                await user.save();
            }
        } else {
            // Create new user
            // Check if first user for admin rights
            const isFirstAccount = (await User.countDocuments({})) === 0;

            user = await User.create({
                name,
                username: email.split('@')[0], // Use part of email as username for Google users (fallback)
                email, // Save email!
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
