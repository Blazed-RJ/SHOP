import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Demo mode bypass
            if (token === 'demo-token-bypass') {
                req.user = {
                    _id: '64e622f46258907f1418b765',
                    name: 'Demo Admin',
                    username: 'demo',
                    role: 'Admin',
                    ownerId: '64e622f46258907f1418b765'
                };
                return next();
            }

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                console.error(`AUTH ERROR: User not found for ID ${decoded.id}`);
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            // TEAM LOGIC: Ensure ownerId is set.
            // If legacy user or Admin/Owner without explicit ownerId, default to self.
            if (!req.user.ownerId) {
                req.user.ownerId = req.user._id;
            }

            next();
        } catch (error) {
            console.error('AUTH ERROR:', error.message);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Admin only middleware
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'Admin') {
        next();
    } else {
        res.status(403);
        throw new Error('Not authorized as an admin');
    }
};

// Staff or Admin middleware
const staffOrAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'Admin' || req.user.role === 'Staff')) {
        next();
    } else {
        res.status(403);
        throw new Error('Not authorized');
    }
};

export { protect, admin, staffOrAdmin };
