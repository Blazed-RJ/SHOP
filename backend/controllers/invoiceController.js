import Invoice from '../models/Invoice.js';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';
import Payment from '../models/Payment.js';
import mongoose from 'mongoose';
import { generateInvoiceNumber } from '../utils/invoiceNumber.js';
import { calculateFromInclusive, calculateFromExclusive, calculateInvoiceSummary } from '../utils/gstCalculator.js';
import LedgerEntry from '../models/LedgerEntry.js';
import { recalculateCustomerBalance } from './ledgerController.js';
import { validateInvoice } from '../utils/validation.js';
import moment from 'moment-timezone';
import { sendEmail } from '../utils/email.js';

// @desc    Create new invoice
// @route   POST /api/invoices
// @access  Private
export const createInvoice = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        console.log('Creates Invoice Payload Data:', JSON.stringify(req.body, null, 2));
        const { invoiceType, invoiceDate, customerId, items, payments, notes, sellerDetails, customerName, customerPhone, customerAddress, customerGstin } = req.body;

        // Validation
        const validationErrors = validateInvoice(req.body);
        if (validationErrors.length > 0) {
            res.status(400);
            throw new Error(validationErrors.join(' '));
        }
        console.log('Validation Passed');

        // Generate unique invoice number (with session for rollback)
        const invoiceNo = await generateInvoiceNumber(session);
        console.log('Invoice No Generated:', invoiceNo);

        if (!items || !Array.isArray(items) || items.length === 0) {
            res.status(400);
            throw new Error('No items in invoice');
        }

        // Calculate line items with GST
        const calculatedItems = items.map(item => {
            const subtotal = item.quantity * item.pricePerUnit;
            let calculation;

            if (item.isTaxInclusive) {
                calculation = calculateFromInclusive(subtotal, item.gstPercent);
            } else {
                calculation = calculateFromExclusive(subtotal, item.gstPercent);
            }

            return {
                ...item,
                taxableValue: calculation.taxableValue,
                gstAmount: calculation.gstAmount,
                totalAmount: calculation.totalAmount
            };
        });

        // Calculate invoice summary
        const summary = calculateInvoiceSummary(calculatedItems);

        // Calculate paid amount from payments array
        const paidAmount = payments ? payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;
        const dueAmount = summary.grandTotal - paidAmount;

        // Determine status
        let status = 'Paid';
        if (dueAmount > 0.01) { // Floating point tolerance
            status = paidAmount > 0 ? 'Partial' : 'Due';
        }

        console.log('Creating Invoice Checkpoint 1');
        // Create invoice
        // Use array syntax for proper transaction handling with create()
        const [invoice] = await Invoice.create([{
            invoiceNo,
            type: invoiceType || 'Tax Invoice',
            invoiceDate: invoiceDate ? moment(invoiceDate).tz("Asia/Kolkata").toDate() : moment().tz("Asia/Kolkata").toDate(),
            customer: customerId,
            items: calculatedItems,
            payments: payments || [],
            totalTaxable: summary.totalTaxable,
            totalGST: summary.totalGST,
            grandTotal: summary.grandTotal,
            paidAmount,
            dueAmount,
            status,
            notes,
            customerName,
            customerPhone,
            customerAddress,
            customerGstin,
            sellerDetails,
            createdBy: req.user._id
        }], { session });

        const createdInvoice = invoice;

        // Update product stock (Bulk Write Optimization)
        const bulkOps = items
            .filter(item => item.productId)
            .map(item => ({
                updateOne: {
                    filter: { _id: item.productId },
                    update: { $inc: { stock: -item.quantity } }
                }
            }));

        if (bulkOps.length > 0) {
            await Product.bulkWrite(bulkOps, { session });
        }

        // Ledger Operations
        if (customerId) {
            // 1. Debit (Sale) - Full Invoice Amount
            await LedgerEntry.create([{
                customer: customerId,
                date: new Date(),
                refType: 'Invoice',
                refId: createdInvoice._id,
                refNo: invoiceNo,
                description: `Invoice ${invoiceNo} Generated`,
                debit: createdInvoice.grandTotal,
                credit: 0,
                balance: 0 // Will recalc
            }], { session });

            // 2. Handle Payments
            if (paidAmount > 0 && payments && payments.length > 0) {

                // Prepare Payment and Ledger Entries
                const newPayments = [];
                const ledgerCredits = [];

                for (const p of payments) {
                    newPayments.push({
                        customer: customerId,
                        invoice: createdInvoice._id,
                        type: 'Debit', // We received money
                        amount: p.amount,
                        method: p.method,
                        reference: p.reference,
                        notes: `Payment for Invoice ${invoiceNo}`,
                        recordedBy: req.user._id
                    });
                }

                // Insert Payments
                const createdPayments = await Payment.create(newPayments, { session });

                // Insert Ledger Credits (linked to payments)
                const ledgerCreditEntries = createdPayments.map(cp => ({
                    customer: customerId,
                    date: new Date(),
                    refType: 'Payment',
                    refId: cp._id,
                    refNo: invoiceNo,
                    description: `Payment Received (${cp.method})`,
                    debit: 0,
                    credit: cp.amount,
                    balance: 0
                }));

                await LedgerEntry.create(ledgerCreditEntries, { session });
            }

            // Recalculate to ensure accuracy
            await recalculateCustomerBalance(customerId, session);
        }

        await session.commitTransaction();
        session.endSession();

        const populatedInvoice = await Invoice.findById(createdInvoice._id)
            .populate('customer')
            .populate('createdBy', 'name');

        res.status(201).json(populatedInvoice);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Invoice Creation Error:', error);
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
export const getInvoices = async (req, res) => {
    try {
        const { startDate, endDate, status, type } = req.query;

        let query = {};

        if (startDate && endDate) {
            query.createdAt = {
                $gte: moment.tz(startDate, "YYYY-MM-DD", "Asia/Kolkata").startOf('day').toDate(),
                $lte: moment.tz(endDate, "YYYY-MM-DD", "Asia/Kolkata").endOf('day').toDate()
            };
        }

        if (status) query.status = status;
        if (type) query.type = type;

        const invoices = await Invoice.find(query)
            .populate('customer', 'name phone')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });

        res.json(invoices);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
export const getInvoiceById = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate('customer')
            .populate('createdBy', 'name')
            .populate('items.productId');

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        res.json(invoice);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update invoice payment
// @route   PUT /api/invoices/:id/payment
// @access  Private
export const updateInvoicePayment = async (req, res) => {
    try {
        const { payments } = req.body;

        const invoice = await Invoice.findById(req.params.id);

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        // Add new payments
        invoice.payments.push(...payments);

        // Recalculate paid amount
        const newPaidAmount = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
        const newDueAmount = invoice.grandTotal - newPaidAmount;

        invoice.paidAmount = newPaidAmount;
        invoice.dueAmount = newDueAmount;
        invoice.status = newDueAmount <= 0 ? 'Paid' : (newPaidAmount > 0 ? 'Partial' : 'Due');

        await invoice.save();

        // Update customer balance & Record Payment (Only for tracked customers)
        if (invoice.customer) {
            const paymentTotal = payments.reduce((sum, p) => sum + p.amount, 0);
            await Customer.findByIdAndUpdate(
                invoice.customer,
                { $inc: { balance: -paymentTotal } }
            );

            // Record payment transaction (Payment Model)
            await Payment.create({
                customer: invoice.customer,
                invoice: invoice._id,
                type: 'Debit', // Customer paid us
                amount: paymentTotal,
                method: payments[0].method,
                notes: `Payment received for Invoice ${invoice.invoiceNo}`,
                recordedBy: req.user._id
            });

            // Ledger Entry: Credit (Payment)
            await LedgerEntry.create({
                customer: invoice.customer,
                date: new Date(),
                refType: 'Payment',
                refId: invoice._id, // Linking to Invoice as ref
                refNo: invoice.invoiceNo,
                description: `Payment for Invoice ${invoice.invoiceNo}`,
                debit: 0,
                credit: paymentTotal,
                balance: 0
            });
            await recalculateCustomerBalance(invoice.customer);
        }

        res.json(invoice);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Void/Cancel invoice (Soft Delete)
// @route   POST /api/invoices/:id/void
// @access  Private (Admin/Manager)
export const voidInvoice = async (req, res) => {
    try {
        const { reason } = req.body;
        const invoice = await Invoice.findById(req.params.id);

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        if (invoice.status === 'Void') {
            return res.status(400).json({ message: 'Invoice is already voided' });
        }

        // 1. Restore Stock
        if (invoice.items && invoice.items.length > 0) {
            for (const item of invoice.items) {
                if (item.productId && item.quantity) {
                    await Product.findByIdAndUpdate(
                        item.productId,
                        { $inc: { stock: item.quantity } }
                    );
                }
            }
        }

        // 2. Revert Customer Due Balance (Cancel Debt)
        if (invoice.dueAmount > 0 && invoice.customer) {
            await Customer.findByIdAndUpdate(
                invoice.customer,
                { $inc: { balance: -invoice.dueAmount } }
            );
        }

        // 3. Mark as Void
        invoice.status = 'Void';
        invoice.voidReason = reason || 'No reason provided';
        invoice.voidedBy = req.user._id;
        invoice.voidedAt = new Date();

        await invoice.save();

        res.json({ message: 'Invoice voided successfully', invoice });

    } catch (error) {
        console.error('Void Invoice Error:', error);
        res.status(500).json({ message: error.message });
    }
};

export const deleteInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        // Restore customer balance if there was due amount
        if (invoice.dueAmount > 0 && invoice.customer) {
            try {
                await Customer.findByIdAndUpdate(
                    invoice.customer,
                    { $inc: { balance: -invoice.dueAmount } }
                );
            } catch (err) {
                console.error('Failed to restore customer balance:', err);
                // Continue deletion
            }
        }

        // Restore product stock (Robust)
        if (invoice.items && invoice.items.length > 0) {
            for (const item of invoice.items) {
                if (item.productId && item.quantity) {
                    try {
                        await Product.findByIdAndUpdate(
                            item.productId,
                            { $inc: { stock: item.quantity } }
                        );
                    } catch (e) {
                        console.error('Stock restore error:', e);
                    }
                }
            }
        }

        await Invoice.deleteOne({ _id: invoice._id });

        // Ledger Entry: Reversal (Credit)
        if (invoice.customer) {
            await LedgerEntry.create({
                customer: invoice.customer,
                date: new Date(),
                refType: 'Reversal',
                refId: null, // Hard deleted, so no link
                refNo: invoice.invoiceNo,
                description: `Invoice ${invoice.invoiceNo} Deleted (Reversal)`,
                debit: 0,
                credit: invoice.grandTotal, // Reverse the Full Sale Amount
                balance: 0
            });
            await recalculateCustomerBalance(invoice.customer);
        }

        res.json({ message: 'Invoice deleted' });
    } catch (error) {
        console.error('Delete Invoice Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Email invoice to customer
// @route   POST /api/invoices/:id/email
export const emailInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id).populate('customer');

        if (!invoice) {
            res.status(404);
            throw new Error('Invoice not found');
        }

        const customerEmail = req.body.email || invoice.customer?.email;

        if (!customerEmail) {
            res.status(400);
            throw new Error('No email address provided');
        }

        // Generate simple HTML table for invoice items
        const itemsHtml = invoice.items.map(item => `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.productName || item.itemName}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.pricePerUnit}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.totalAmount}</td>
            </tr>
        `).join('');

        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Invoice #${invoice.invoiceNo}</h2>
                <p>Dear ${invoice.customer?.name || 'Customer'},</p>
                <p>Thank you for your business. Here is a summary of your invoice:</p>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <thead>
                        <tr style="background-color: #f8f9fa;">
                            <th style="padding: 8px; text-align: left;">Item</th>
                            <th style="padding: 8px; text-align: center;">Qty</th>
                            <th style="padding: 8px; text-align: right;">Rate</th>
                            <th style="padding: 8px; text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3" style="padding: 8px; text-align: right; font-weight: bold;">Grand Total:</td>
                            <td style="padding: 8px; text-align: right; font-weight: bold;">₹${invoice.grandTotal}</td>
                        </tr>
                    </tfoot>
                </table>

                <p>Date: ${moment(invoice.invoiceDate).format('DD-MM-YYYY')}</p>
                <p>Regards,<br>Your Shop Team</p>
            </div>
        `;

        await sendEmail({
            to: customerEmail,
            subject: `Invoice #${invoice.invoiceNo} from Your Shop`,
            html: emailHtml
        });

        res.json({ message: 'Invoice sent successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Failed to send email' });
    }
};
