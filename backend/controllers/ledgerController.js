import LedgerEntry from '../models/LedgerEntry.js';
import Customer from '../models/Customer.js';
import mongoose from 'mongoose';
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
        const Invoice = (await import('../models/Invoice.js')).default;

        // REFACTORED: Use 'date' (business date) instead of 'createdAt' for accurate Daybook
        const ownerId = new mongoose.Types.ObjectId(req.user.ownerId);

        const previousIn = await Payment.aggregate([
            { $match: { user: ownerId, date: { $lt: startDate }, type: 'Debit' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const previousOut = await Payment.aggregate([
            { $match: { user: ownerId, date: { $lt: startDate }, type: 'Credit' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        // Also include invoices in opening balance (invoices = sales = cash in)
        const previousInvoices = await Invoice.aggregate([
            { $match: { user: ownerId, invoiceDate: { $lt: startDate }, status: { $ne: 'Void' } } },
            { $group: { _id: null, total: { $sum: '$grandTotal' } } }
        ]);

        // DEBUG: Log aggregation results
        console.log('Opening Balance Calculation:');
        console.log(`  startDate (looking for < this): ${startDate.toISOString()}`);
        console.log(`  Previous IN (Debit):`, previousIn);
        console.log(`  Previous OUT (Credit):`, previousOut);
        console.log(`  Previous Invoices:`, previousInvoices);
        console.log(`  Calculated Opening Balance: ${(previousIn[0]?.total || 0)} + ${(previousInvoices[0]?.total || 0)} - ${(previousOut[0]?.total || 0)}`);

        const openingBalance = (previousIn[0]?.total || 0) + (previousInvoices[0]?.total || 0) - (previousOut[0]?.total || 0);

        // Get all transactions for the day
        const transactions = [];

        // 1. Get customer payments (Cash IN) - using 'date' query
        const customerPayments = await Payment.find({
            customer: { $ne: null },
            type: 'Debit', // Customer paid us
            date: { $gte: startDate, $lte: endDate },
            user: req.user.ownerId
        })
            .populate('customer', 'name')
            .lean();

        customerPayments.forEach(payment => {
            transactions.push({
                _id: payment._id,
                type: 'Sale',
                description: payment.notes || `Payment from ${payment.customer?.name || 'Customer'}`,
                party: payment.customer,
                partyType: 'Customer',
                paymentMode: payment.method, // Fixed: Payment schema uses 'method' not 'paymentMode'
                notes: payment.notes,
                billNumber: payment.reference || null, // Fixed: Payment schema uses 'reference' not 'billNumber'
                amount: payment.amount,
                date: payment.date,
                createdAt: payment.createdAt
            });
        });

        // 2. Get supplier payments (Cash OUT) - using 'date' query
        const supplierPayments = await Payment.find({
            supplier: { $ne: null },
            type: 'Credit', // We paid supplier
            date: { $gte: startDate, $lte: endDate },
            user: req.user.ownerId
        }).populate('supplier', 'name');

        supplierPayments.forEach(payment => {
            transactions.push({
                _id: payment._id,
                type: 'Purchase',
                description: `Payment to ${payment.supplier?.name || 'Supplier'}`,
                party: payment.supplier,
                partyType: 'Supplier',
                paymentMode: payment.method, // Fixed: Payment schema uses 'method' not 'paymentMode'
                notes: payment.notes,
                billNumber: payment.reference || null, // Fixed: Payment schema uses 'reference' not 'billNumber'
                amount: payment.amount,
                date: payment.date,
                createdAt: payment.createdAt
            });
        });

        // 2b. Get Expenses, Drawings and Receipts (Cash OUT/IN) - using 'date' query
        const expenses = await Payment.find({
            category: { $in: ['Expense', 'Drawing', 'Receipt'] },
            date: { $gte: startDate, $lte: endDate },
            user: req.user.ownerId
        });

        expenses.forEach(exp => {
            transactions.push({
                _id: exp._id,
                type: exp.category, // 'Expense' or 'Drawing'
                description: exp.name || exp.notes || exp.category,
                party: exp.supplier || null,
                partyType: exp.supplier ? 'Expense' : null,
                paymentMode: exp.method, // Fixed: Payment schema uses 'method' not 'paymentMode'
                notes: exp.notes,
                billNumber: exp.reference || null, // Fixed: Payment schema uses 'reference' not 'billNumber'
                amount: exp.amount,
                date: exp.date,
                createdAt: exp.createdAt
            });
        });

        // 3. Get invoices created (Sales) - using 'invoiceDate' to match Daybook logic
        const invoices = await Invoice.find({
            invoiceDate: { $gte: startDate, $lte: endDate },
            status: { $ne: 'Void' }, // Exclude voided invoices
            user: req.user.ownerId
        }).populate('customer', 'name');

        invoices.forEach(inv => {
            transactions.push({
                _id: inv._id,
                type: 'Invoice',
                description: `Invoice #${inv.invoiceNo} - ${inv.customerName || inv.customer?.name || 'Cash Sale'}`,
                party: inv.customer,
                partyType: 'Customer',
                paymentMode: null,
                notes: inv.notes || null,
                billNumber: inv.invoiceNo,
                amount: inv.grandTotal,
                status: inv.status, // Paid, Partial, Due
                date: inv.invoiceDate,
                createdAt: inv.createdAt
            });
        });

        // Sort by time (Newest First)
        transactions.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

        // Calculate totals for the day
        let totalIn = 0;
        let totalOut = 0;

        transactions.forEach(t => {
            // Determine visual "type" for calculation
            const isOut = t.type === 'Purchase' || t.type === 'Expense' || t.type === 'Drawing';
            if (isOut) {
                totalOut += t.amount;
            } else {
                totalIn += t.amount;
            }
        });

        const closingBalance = openingBalance + totalIn - totalOut;

        res.json({
            openingBalance,
            transactions,
            totalIn,
            totalOut,
            closingBalance,
            date
        });
    } catch (error) {
        console.error('Daybook error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update ledger entry
// @route   PUT /api/ledger/:id
// @access  Private
export const updateLedgerEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const { date, description, refNo, debit, credit } = req.body;

        const entry = await LedgerEntry.findById(id);

        if (!entry) {
            return res.status(404).json({ message: 'Entry not found' });
        }

        // Verify ownership
        if (entry.user.toString() !== req.user.ownerId.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Update fields
        // Update fields
        if (date) entry.date = date;
        if (description) entry.description = description;
        if (refNo !== undefined) entry.refNo = refNo; // Allow clearing refNo

        // Handle File Attachment
        if (req.file) {
            entry.billAttachment = `/uploads/bills/${req.file.filename}`;
        } else if (req.body.deleteAttachment === 'true') {
            entry.billAttachment = '';
        }

        // Handle Debit/Credit changes securely
        if (debit !== undefined) entry.debit = parseFloat(debit) || 0;
        if (credit !== undefined) entry.credit = parseFloat(credit) || 0;

        await entry.save();

        // Trigger Recalculation
        await recalculateCustomerBalance(entry.customer, null, req.user.ownerId);

        res.json(entry);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete ledger entry
// @route   DELETE /api/ledger/:id
// @access  Private
export const deleteLedgerEntry = async (req, res) => {
    try {
        const { id } = req.params;

        const entry = await LedgerEntry.findById(id);

        if (!entry) {
            return res.status(404).json({ message: 'Entry not found' });
        }

        // Verify ownership
        if (entry.user.toString() !== req.user.ownerId.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const customerId = entry.customer;

        await LedgerEntry.deleteOne({ _id: id });

        // Recalculate balance
        await recalculateCustomerBalance(customerId, null, req.user.ownerId);

        res.json({ message: 'Entry deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
