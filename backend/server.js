import express from 'express';
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

// Config
dotenv.config();
connectDB();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Serve uploaded files // Body parser

// Static Folder for Images (Option A)
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

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

// Placeholder routes for later phases
app.get('/', (req, res) => {
    res.send('API is running in IST Timezone...');
});

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