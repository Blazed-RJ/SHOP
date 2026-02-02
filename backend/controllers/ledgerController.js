import LedgerEntry from '../models/LedgerEntry.js';
import Customer from '../models/Customer.js';
import moment from 'moment-timezone';

// @desc    Get customer ledger
// @route   GET /api/ledger/:customerId
// @access  Private
export const getLedger = async (req, res) => {
    try {
        const { customerId } = req.params;
        const { limit = 100, skip = 0 } = req.query;

        // Verify customer ownership implicitly by ensuring LedgerEntries belong to user
        const ledger = await LedgerEntry.find({ customer: customerId, user: req.user.ownerId })
            .sort({ date: 1, createdAt: 1 })
            .limit(Number(limit))
            .skip(Number(skip));

        const total = await LedgerEntry.countDocuments({ customer: customerId, user: req.user.ownerId });

        res.json({
            ledger,
            total,
            limit: Number(limit),
            skip: Number(skip)
        });
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
        await recalculateCustomerBalance(customerId, null, req.user.ownerId);
        res.json({ message: 'Ledger recalculated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Helper: Recalculate Logic (Optimized)
export const recalculateCustomerBalance = async (customerId, session = null, userId = null) => {
    // Pass session if available
    const queryOptions = session ? { session } : {};
    const filter = { customer: customerId };
    if (userId) filter.user = userId;

    const entries = session
        ? await LedgerEntry.find(filter).sort({ date: 1, createdAt: 1 }).session(session)
        : await LedgerEntry.find(filter).sort({ date: 1, createdAt: 1 });

    let runningBalance = 0;
    const bulkOps = [];

    for (const entry of entries) {
        // Logic: Balance = Previous + Debit - Credit
        runningBalance = runningBalance + (entry.debit || 0) - (entry.credit || 0);

        // Only update if balance is different to save writes (use stricter tolerance)
        if (Math.abs(entry.balance - runningBalance) > 0.001) {
            bulkOps.push({
                updateOne: {
                    filter: { _id: entry._id },
                    update: { $set: { balance: runningBalance } }
                }
            });
        }
    }

    // Batch update only if there are changes
    if (bulkOps.length > 0) {
        await LedgerEntry.bulkWrite(bulkOps, queryOptions);
    }

    // Update Customer Model Balance too
    if (session) {
        await Customer.findByIdAndUpdate(customerId, { balance: runningBalance }).session(session);
    } else {
        await Customer.findByIdAndUpdate(customerId, { balance: runningBalance });
    }

    return runningBalance;
};

/**
 * Optimized Incremental Balance Update (O(1))
 * Replaces full recalculation for daily operations
 */
export const incrementCustomerBalance = async (customerId, amount, session = null) => {
    const options = { new: true };
    if (session) options.session = session;

    // Use atomic $inc
    const updatedCustomer = await Customer.findByIdAndUpdate(
        customerId,
        { $inc: { balance: amount } },
        options
    );

    return updatedCustomer ? updatedCustomer.balance : 0;
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

        // Calculate opening balance (cash in hand from previous day)
        // Cash In = Payments from Customers
        // Cash Out = Payments to Suppliers, Expenses, Drawings
        const Payment = (await import('../models/Payment.js')).default;

        const previousIn = await Payment.aggregate([
            { $match: { user: req.user.ownerId, createdAt: { $lt: startDate }, type: 'Debit' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const previousOut = await Payment.aggregate([
            { $match: { user: req.user.ownerId, createdAt: { $lt: startDate }, type: 'Credit' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const openingBalance = (previousIn[0]?.total || 0) - (previousOut[0]?.total || 0);

        // Get all transactions for the day
        const transactions = [];

        // 1. Get customer payments (Cash IN) -  optimized query
        const customerPayments = await Payment.find({
            customer: { $ne: null },
            type: 'Debit', // Customer paid us
            createdAt: { $gte: startDate, $lte: endDate },
            user: req.user.ownerId
        })
            .populate('customer', 'name')
            .lean(); // Use lean() for better performance

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
            user: req.user.ownerId
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
            user: req.user.ownerId
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
            user: req.user.ownerId
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

