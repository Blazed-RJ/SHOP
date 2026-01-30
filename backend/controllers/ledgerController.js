import LedgerEntry from '../models/LedgerEntry.js';
import Customer from '../models/Customer.js';
import moment from 'moment-timezone';

// @desc    Get customer ledger
// @route   GET /api/ledger/:customerId
// @access  Private
export const getLedger = async (req, res) => {
    try {
        const { customerId } = req.params;
        // Verify customer ownership implicitly by ensuring LedgerEntries belong to user
        const ledger = await LedgerEntry.find({ customer: customerId, user: req.user._id })
            .sort({ date: 1, createdAt: 1 });

        res.json(ledger);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Recalculate running balance for a customer
// @route   POST /api/ledger/recalculate/:customerId
// @access  Private
export const recalculateLedger = async (req, res) => {
    try {
        const { customerId } = req.params;
        await recalculateCustomerBalance(customerId);
        res.json({ message: 'Ledger recalculated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Helper: Recalculate Logic
export const recalculateCustomerBalance = async (customerId, session = null) => {
    // Pass session if available
    const queryOptions = { session };
    const entries = await LedgerEntry.find({ customer: customerId })
        .sort({ date: 1, createdAt: 1 })
        .session(session);

    let runningBalance = 0;
    const bulkOps = [];

    for (const entry of entries) {
        // Logic: Balance = Previous + Debit - Credit
        runningBalance = runningBalance + (entry.debit || 0) - (entry.credit || 0);

        // Only update if balance is different to save writes (optional but good practice)
        // For simplicity and correctness in bulk recap, we just overwrite.
        bulkOps.push({
            updateOne: {
                filter: { _id: entry._id },
                update: { $set: { balance: runningBalance } }
            }
        });
    }

    if (bulkOps.length > 0) {
        await LedgerEntry.bulkWrite(bulkOps, queryOptions);
    }

    // Update Customer Model Balance too
    await Customer.findByIdAndUpdate(customerId, { balance: runningBalance }).session(session);

    return runningBalance;
};

// @desc    Get daybook for a specific date
// @route   GET /api/ledger/daybook?date=YYYY-MM-DD
// @access  Private
export const getDaybook = async (req, res) => {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ message: 'Date parameter is required' });
        }

        // Parse date in IST to ensure we capture the full local day
        const startOfDay = moment.tz(date, "YYYY-MM-DD", "Asia/Kolkata").startOf('day');
        const endOfDay = moment.tz(date, "YYYY-MM-DD", "Asia/Kolkata").endOf('day');

        const startDate = startOfDay.toDate(); // Convert to JS Date (UTC)
        const endDate = endOfDay.toDate(); // Convert to JS Date (UTC)

        console.log(`Fetching Daybook for ${date} (Query: ${startDate.toISOString()} - ${endDate.toISOString()})`);

        // TODO: Get opening balance (cash in hand from previous day)
        const openingBalance = 0; // Placeholder

        // Get all transactions for the day
        const transactions = [];

        // 1. Get customer payments (Cash IN)
        const Payment = (await import('../models/Payment.js')).default;
        const customerPayments = await Payment.find({
            customer: { $ne: null },
            type: 'Debit', // Customer paid us
            createdAt: { $gte: startDate, $lte: endDate },
            user: req.user._id
        }).populate('customer', 'name');

        customerPayments.forEach(payment => {
            transactions.push({
                _id: payment._id,
                type: 'Sale',
                description: payment.notes || `Payment from ${payment.customer?.name || 'Customer'}`,
                party: payment.customer,
                amount: payment.amount,
                createdAt: payment.createdAt
            });
        });

        // 2. Get supplier payments (Cash OUT)
        const supplierPayments = await Payment.find({
            supplier: { $ne: null },
            createdAt: { $gte: startDate, $lte: endDate },
            user: req.user._id
        }).populate('supplier', 'name');

        supplierPayments.forEach(payment => {
            transactions.push({
                _id: payment._id,
                type: 'Purchase',
                description: `Payment to ${payment.supplier?.name || 'Supplier'}`,
                party: payment.supplier,
                amount: payment.amount,
                createdAt: payment.createdAt
            });
        });

        // 2b. Get Expenses and Drawings (Cash OUT)
        const expenses = await Payment.find({
            category: { $in: ['Expense', 'Drawing'] },
            createdAt: { $gte: startDate, $lte: endDate },
            user: req.user._id
        });

        expenses.forEach(exp => {
            transactions.push({
                _id: exp._id,
                type: exp.category, // 'Expense' or 'Drawing'
                description: exp.notes || exp.category,
                party: null, // No party for expenses
                amount: exp.amount,
                createdAt: exp.createdAt
            });
        });

        // 3. Get invoices created (Sales)
        const Invoice = (await import('../models/Invoice.js')).default;
        const invoices = await Invoice.find({
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $ne: 'Void' }, // Exclude voided invoices
            user: req.user._id
        }).populate('customer', 'name');

        invoices.forEach(inv => {
            transactions.push({
                _id: inv._id,
                type: 'Invoice',
                description: `Invoice #${inv.invoiceNo} - ${inv.customerName || inv.customer?.name || 'Cash Sale'}`,
                party: inv.customer,
                amount: inv.grandTotal,
                status: inv.status, // Paid, Partial, Due
                createdAt: inv.createdAt
            });
        });

        // Sort by time (Newest First usually better for daybook, or Oldest First? Code had a-b, which is Oldest First)
        transactions.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        res.json({
            openingBalance,
            transactions,
            date
        });
    } catch (error) {
        console.error('Daybook error:', error);
        res.status(500).json({ message: error.message });
    }
};

