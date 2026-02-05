import Payment from '../models/Payment.js';
import Customer from '../models/Customer.js';
import Supplier from '../models/Supplier.js';
import LedgerEntry from '../models/LedgerEntry.js';
import SupplierLedgerEntry from '../models/SupplierLedgerEntry.js';
import { recalculateCustomerBalance, incrementCustomerBalance } from './ledgerController.js';
import { recalculateSupplierBalance } from './supplierLedgerController.js';
import Invoice from '../models/Invoice.js';
import moment from 'moment-timezone';

// @desc    Record a standalone payment (not tied to a specific invoice)
// @route   POST /api/payments
// @access  Private
export const recordPayment = async (req, res) => {
    try {
        const { customerId, amount, method, notes, date } = req.body;

        if (!customerId || !amount || amount <= 0) {
            return res.status(400).json({ message: 'Customer ID and valid amount are required' });
        }

        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Use custom date or current date
        const transactionDate = date ? moment(date).tz("Asia/Kolkata").toDate() : moment().tz("Asia/Kolkata").toDate();

        // Create payment record
        const payment = await Payment.create({
            customer: customerId,
            invoice: null, // Standalone payment
            type: 'Debit', // Customer paid us (Debit from payment perspective)
            amount: amount,
            method: method || 'Cash',
            notes: notes || 'Direct payment recorded',
            recordedBy: req.user._id,
            user: req.user.ownerId,
            date: transactionDate // FIX: Save business date
        });

        const newBalance = await incrementCustomerBalance(customerId, -amount); // Credit reduces balance

        await LedgerEntry.create({
            customer: customerId,
            date: transactionDate,
            refType: 'Payment',
            refId: payment._id,
            refNo: `PAY-${payment._id.toString().slice(-8).toUpperCase()}`,
            description: notes || 'Direct payment received',
            debit: 0,
            credit: amount,
            balance: newBalance,
            user: req.user.ownerId
        });

        res.status(201).json({
            message: 'Payment recorded successfully',
            payment
        });
    } catch (error) {
        console.error('Record Payment Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Record a payment to supplier
// @route   POST /api/payments/supplier
// @access  Private
export const recordSupplierPayment = async (req, res) => {
    try {
        const { supplierId, amount, method, notes, date } = req.body;

        if (!supplierId || !amount || amount <= 0) {
            return res.status(400).json({ message: 'Supplier ID and valid amount are required' });
        }

        const supplier = await Supplier.findById(supplierId);
        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }

        // Use custom date or current date
        const transactionDate = date ? moment(date).tz("Asia/Kolkata").toDate() : moment().tz("Asia/Kolkata").toDate();

        // Create payment record
        const payment = await Payment.create({
            customer: null,
            supplier: supplierId, // Link to supplier
            invoice: null,
            type: 'Credit', // We paid OUT (Credit from payment perspective)
            amount: amount,
            method: method || 'Cash',
            notes: notes || 'Payment to supplier',
            recordedBy: req.user._id,
            user: req.user.ownerId,
            date: transactionDate // FIX: Save business date
        });

        // Update supplier balance (decrease what we owe)
        await Supplier.findByIdAndUpdate(supplierId, {
            $inc: { balance: -amount }
        });

        // Create supplier ledger entry (Debit - reduces our liability)
        await SupplierLedgerEntry.create({
            supplier: supplierId,
            date: transactionDate,
            refType: 'Payment',
            refId: payment._id,
            refNo: `PAY-${payment._id.toString().slice(-8).toUpperCase()}`,
            description: notes || 'Payment to supplier',
            debit: amount,
            credit: 0,
            balance: 0, // Will be recalculated
            user: req.user.ownerId,
            billAttachment: req.file ? `/uploads/bills/${req.file.filename}` : ''
        });

        // Recalculate ledger balance
        await recalculateSupplierBalance(supplierId, req.user.ownerId);

        res.status(201).json({
            message: 'Supplier payment recorded successfully',
            payment
        });
    } catch (error) {
        console.error('Record Supplier Payment Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Record an expense or drawing (Cash Out)
// @route   POST /api/payments/expense
// @access  Private
export const recordExpense = async (req, res) => {
    try {
        const { amount, method, notes, category, date } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Valid amount is required' });
        }

        if (!['Expense', 'Drawing'].includes(category)) {
            return res.status(400).json({ message: 'Invalid category for this endpoint' });
        }

        // Use custom date or current date
        const transactionDate = date ? moment(date).tz("Asia/Kolkata").toDate() : moment().tz("Asia/Kolkata").toDate();

        // Create payment record
        const payment = await Payment.create({
            customer: null,
            supplier: null,
            invoice: null,
            type: 'Credit', // Cash Out
            amount: amount,
            method: method || 'Cash',
            notes: notes || `${category} recorded`,
            name: req.body.name || '', // Save Expense Name
            category: category,
            recordedBy: req.user._id,
            user: req.user.ownerId,
            date: transactionDate // FIX: Save business date
        });

        res.status(201).json({
            message: `${category} recorded successfully`,
            payment
        });
    } catch (error) {
        console.error('Record Expense Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all expenses
// @route   GET /api/payments/expenses
// @access  Private
export const getExpenses = async (req, res) => {
    try {
        const { startDate, endDate, category } = req.query;
        let query = {
            user: req.user.ownerId,
            type: 'Credit', // Expenses are money out
            category: { $in: ['Expense', 'Drawing'] }
        };

        if (category && category !== 'All') {
            query.category = category;
        }

        if (startDate && endDate) {
            query.date = {
                $gte: moment(startDate).startOf('day').toDate(),
                $lte: moment(endDate).endOf('day').toDate()
            };
        }

        const expenses = await Payment.find(query)
            .sort({ date: -1, createdAt: -1 });

        res.json(expenses);
    } catch (error) {
        console.error('Get Expenses Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a payment
// @route   DELETE /api/payments/:id
// @access  Private (Admin/Manager)
export const deletePayment = async (req, res) => {
    try {
        const payment = await Payment.findOne({ _id: req.params.id, user: req.user.ownerId });

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        // 1. Revert Customer Balance
        if (payment.customer) {
            const reversalAmount = payment.type === 'Debit' ? payment.amount : -payment.amount;
            await incrementCustomerBalance(payment.customer, reversalAmount);
            // await Customer.findOneAndUpdate(
            //     { _id: payment.customer, user: req.user.ownerId },
            //     { $inc: { balance: reversalAmount } }
            // );
            await LedgerEntry.deleteMany({ refId: payment._id });
        }

        // 2. Revert Supplier Balance
        if (payment.supplier) {
            const reversalAmount = payment.type === 'Credit' ? payment.amount : -payment.amount;
            await Supplier.findOneAndUpdate(
                { _id: payment.supplier, user: req.user.ownerId },
                { $inc: { balance: reversalAmount } }
            );
            await SupplierLedgerEntry.deleteMany({ refId: payment._id });
        }

        // 3. Update Invoice (if linked)
        if (payment.invoice) {
            const invoice = await Invoice.findOne({ _id: payment.invoice, user: req.user.ownerId });
            if (invoice) {
                invoice.paidAmount = Math.max(0, invoice.paidAmount - payment.amount);
                invoice.dueAmount = invoice.grandTotal - invoice.paidAmount;

                if (invoice.dueAmount <= 0) invoice.status = 'Paid';
                else if (invoice.paidAmount > 0) invoice.status = 'Partial';
                else invoice.status = 'Due';

                await invoice.save();
            }
        }

        // 4. Delete Payment
        await Payment.deleteOne({ _id: payment._id });

        // 5. Recalculate Ledgers (Optimized: Removed for customer, kept for supplier as not optimized yet)
        // if (payment.customer) await recalculateCustomerBalance(payment.customer, null, req.user.ownerId);
        if (payment.supplier) await recalculateSupplierBalance(payment.supplier, req.user.ownerId);

        res.json({ message: 'Payment deleted successfully' });

    } catch (error) {
        console.error('Delete Payment Error:', error);
        res.status(500).json({ message: error.message });
    }
};
