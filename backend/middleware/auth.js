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
                    role: 'Admin'
                };
                return next();
            }

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token
            req.user = await User.findById(decoded.id).select('-password');

            next();
        } catch (error) {
            console.error(error);
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    }

    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
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
