import express from 'express'; // Force restart

import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import invoiceRoutes from './routes/invoices.js';
import customerRoutes from './routes/customers.js';
import supplierRoutes from './routes/suppliers.js';
import ledgerRoutes from './routes/ledger.js';
import settingsRoutes from './routes/settings.js';
import categoryRoutes from './routes/categories.js';
import paymentRoutes from './routes/payments.js';
import supplierLedgerRoutes from './routes/supplierLedger.js';
import letterheadRoutes from './routes/letterheadRoutes.js';
import dashboardRoutes from './routes/dashboard.js';
import publicRoutes from './routes/publicRoutes.js';
import accountingRoutes from './routes/accountingRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import purchaseRoutes from './routes/purchaseRoutes.js';

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Config
dotenv.config();

// Crash early if critical env vars are missing
if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET is not set. Refusing to start.');
    process.exit(1);
}

connectDB();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Security Middleware
app.use(
    helmet({
        contentSecurityPolicy: {
            useDefaults: true,
            directives: {
                "default-src": ["'self'"],
                "script-src": ["'self'", "https://accounts.google.com", "https://apis.google.com"],
                "frame-src": ["'self'", "https://accounts.google.com"],
                "connect-src": ["'self'", "https://accounts.google.com", "https://oauth2.googleapis.com"],
                "img-src": ["'self'", "data:", "https://lh3.googleusercontent.com"],
            },
        },
        crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    })
);

// Global Rate Limiting (generous — auth routes have their own stricter limiter)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        const ip = req.ip || req.socket.remoteAddress;
        return ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1';
    },
});
app.use(limiter);

// Middleware
const corsOptions = {
    origin: process.env.FRONTEND_URL || '*', // Allow specific domain or all for dev
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));

// Static Folder for Images - Add CORS headers for cross-origin access
app.use('/uploads', (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
}, express.static(path.join(__dirname, '/uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/supplier-ledger', supplierLedgerRoutes);
app.use('/api/letterheads', letterheadRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/purchases', purchaseRoutes);

// Serve Static Assets in Production
if (process.env.NODE_ENV === 'production') {
    // Set static folder
    app.use(express.static(path.join(__dirname, '../frontend/dist')));

    // Any route that is not an API route will be handled by the React app
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../frontend/dist', 'index.html'));
    });
} else {
    app.get('/', (req, res) => {
        res.send('API is running in Development mode... Use Frontend to access app.');
    });
}


// Error Handling
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

const PORT = process.env.PORT || 5000; // Let Railway decide the port

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});