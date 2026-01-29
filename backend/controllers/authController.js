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

export { registerUser, authUser };
