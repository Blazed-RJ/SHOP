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
import { runInTransaction } from '../utils/transactionWrapper.js';
import { validateStockAvailability, deductStock, restoreStock, formatStockErrors } from '../utils/stockManager.js';
import { ValidationError, StockError } from '../utils/errorHandler.js';

const log = (msg) => {
    // Debug logging disabled
    // console.log(msg);
};

// @desc    Create new invoice
// @route   POST /api/invoices
// @access  Private
export const createInvoice = async (req, res) => {
    try {
        // Pre-validate stock BEFORE starting transaction (performance optimization)
        const { items, customerId, invoiceType, invoiceDate, payments, notes, sellerDetails, customerName, customerPhone, customerAddress, customerGstin } = req.body;

        // Validation
        const validationErrors = validateInvoice(req.body);
        if (validationErrors.length > 0) {
            throw new ValidationError(validationErrors.join('; '));
        }
        console.log('Validation Passed');

        // Check stock availability BEFORE transaction
        const stockValidation = await validateStockAvailability(items, req.user.ownerId);
        if (!stockValidation.valid) {
            throw new StockError(formatStockErrors(stockValidation.errors));
        }
        console.log('Stock validation passed');

        const result = await runInTransaction(async (session) => {
            console.log('Creates Invoice Payload Data:', JSON.stringify(req.body, null, 2));

            log('Calling generateInvoiceNumber with session: ' + (session ? 'YES' : 'NO'));
            const invoiceNo = await generateInvoiceNumber(session);
            log('Invoice No Generated: ' + invoiceNo);

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

            log('Creating Invoice Checkpoint: Calling Invoice.create');
            let invoice;
            const invoiceData = [{
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
                createdBy: req.user._id, // Created By is the actual user (Staff/Admin)
                user: req.user.ownerId   // Ownership belongs to the Admin
            }];

            if (session) {
                log('Using SESSION for Invoice.create');
                [invoice] = await Invoice.create(invoiceData, { session });
            } else {
                log('Using NO SESSION for Invoice.create');
                [invoice] = await Invoice.create(invoiceData);
            }
            log('Invoice Created Successfully');
            const createdInvoice = invoice;
            log('Invoice Created Successfully: ' + createdInvoice._id);

            // Update product stock using stockManager (Optimized)
            log('Checkpoint: Stock Update');
            await deductStock(items, req.user.ownerId, session);

            // Ledger Operations
            if (customerId) {
                log('Checkpoint: Ledger Create');
                // 1. Debit (Sale) - Full Invoice Amount
                const ledgerEntryData = [{
                    customer: customerId,
                    date: new Date(),
                    refType: 'Invoice',
                    refId: createdInvoice._id,
                    refNo: invoiceNo,
                    description: `Invoice ${invoiceNo} Generated`,
                    debit: createdInvoice.grandTotal,
                    credit: 0,
                    balance: 0, // Will recalc
                    user: req.user.ownerId
                }];

                if (session) {
                    await LedgerEntry.create(ledgerEntryData, { session });
                } else {
                    await LedgerEntry.create(ledgerEntryData);
                }

                // 2. Handle Payments (Optimized with bulk operations)
                if (paidAmount > 0 && payments && payments.length > 0) {

                    // Prepare Payment entries
                    const newPayments = payments.map(p => ({
                        customer: customerId,
                        invoice: createdInvoice._id,
                        type: 'Debit', // We received money
                        amount: p.amount,
                        method: p.method,
                        reference: p.reference,
                        notes: `Payment for Invoice ${invoiceNo}`,
                        recordedBy: req.user._id,
                        user: req.user.ownerId
                    }));

                    // Insert Payments (bulk operation)
                    let createdPayments;
                    if (session) {
                        createdPayments = await Payment.create(newPayments, { session });
                    } else {
                        createdPayments = await Payment.create(newPayments);
                    }

                    // Prepare Ledger Credit entries (bulk)
                    const ledgerCreditEntries = createdPayments.map(cp => ({
                        customer: customerId,
                        date: new Date(),
                        refType: 'Payment',
                        refId: cp._id,
                        refNo: invoiceNo,
                        description: `Payment Received (${cp.method})`,
                        debit: 0,
                        credit: cp.amount,
                        balance: 0,
                        user: req.user.ownerId
                    }));

                    // Insert Ledger Credits (bulk operation)
                    if (session) {
                        await LedgerEntry.create(ledgerCreditEntries, { session });
                    } else {
                        await LedgerEntry.create(ledgerCreditEntries);
                    }
                }

                // Recalculate to ensure accuracy
                log('Checkpoint: Recalc');
                await recalculateCustomerBalance(customerId, session, req.user.ownerId);
            }
            log('Checkpoint: Success Final');

            return createdInvoice;
        });

        // Populate with error handling
        let populatedInvoice;
        try {
            populatedInvoice = await Invoice.findById(result._id)
                .populate('customer')
                .populate('createdBy', 'name');
        } catch (populateError) {
            console.warn('Failed to populate invoice, returning basic data:', populateError.message);
            populatedInvoice = result; // Fallback to unpopulated
        }

        log('Sending Response 201');
        res.status(201).json(populatedInvoice);
    } catch (error) {
        log('ERROR CAUGHT in createInvoice: ' + error.message);
        console.error('Invoice Creation Error:', {
            message: error.message,
            name: error.name,
            userId: req.user?._id,
            itemCount: req.body?.items?.length
        });

        // Only send response if not already sent
        if (!res.headersSent) {
            const statusCode = error.statusCode || (error instanceof ValidationError || error instanceof StockError ? 400 : 500);
            res.status(statusCode).json({
                message: error.message,
                code: error.code || 'INVOICE_CREATION_FAILED'
            });
        }
    }
};

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
export const getInvoices = async (req, res) => {
    try {
        const { startDate, endDate, status, type, search, limit = 50, skip = 0 } = req.query;

        let query = { user: req.user.ownerId };

        if (startDate && endDate) {
            query.createdAt = {
                $gte: moment.tz(startDate, "YYYY-MM-DD", "Asia/Kolkata").startOf('day').toDate(),
                $lte: moment.tz(endDate, "YYYY-MM-DD", "Asia/Kolkata").endOf('day').toDate()
            };
        }

        if (status && status !== 'All') query.status = status;
        if (type) query.type = type;

        if (search) {
            query.$or = [
                { invoiceNo: { $regex: search, $options: 'i' } },
                { customerName: { $regex: search, $options: 'i' } },
                { customerPhone: { $regex: search, $options: 'i' } }
            ];
        }

        const invoices = await Invoice.find(query)
            .populate('customer', 'name phone')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip(Number(skip));

        const total = await Invoice.countDocuments(query);

        res.json({
            invoices,
            total,
            limit: Number(limit),
            skip: Number(skip)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
export const getInvoiceById = async (req, res) => {
    try {
        const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user.ownerId })
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
        const result = await runInTransaction(async (session) => {
            const { payments } = req.body;

            const invoice = await Invoice.findById(req.params.id).session(session);

            // Security check: must belong to owner
            if (!invoice || invoice.user.toString() !== req.user.ownerId.toString()) {
                res.status(404);
                throw new Error('Invoice not found');
            }

            // Add new payments
            invoice.payments.push(...payments);

            // Recalculate paid amount
            const newPaidAmount = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
            const newDueAmount = invoice.grandTotal - newPaidAmount;

            invoice.paidAmount = newPaidAmount;
            invoice.dueAmount = newDueAmount;
            invoice.status = newDueAmount <= 0 ? 'Paid' : (newPaidAmount > 0 ? 'Partial' : 'Due');

            await invoice.save({ session });

            // Update customer balance & Record Payment (Only for tracked customers)
            if (invoice.customer) {
                const paymentTotal = payments.reduce((sum, p) => sum + p.amount, 0);
                await Customer.findOneAndUpdate(
                    { _id: invoice.customer, user: req.user.ownerId },
                    { $inc: { balance: -paymentTotal } }
                ).session(session);

                // Record payment transaction (Payment Model)
                await Payment.create([{
                    customer: invoice.customer,
                    invoice: invoice._id,
                    type: 'Debit', // Customer paid us
                    amount: paymentTotal,
                    method: payments[0].method,
                    notes: `Payment received for Invoice ${invoice.invoiceNo}`,
                    recordedBy: req.user._id, // Actual Staff doing the update
                    user: req.user.ownerId
                }], { session });

                // Ledger Entry: Credit (Payment)
                await LedgerEntry.create([{
                    customer: invoice.customer,
                    date: new Date(),
                    refType: 'Payment',
                    refId: invoice._id, // Linking to Invoice as ref
                    refNo: invoice.invoiceNo,
                    description: `Payment for Invoice ${invoice.invoiceNo}`,
                    debit: 0,
                    credit: paymentTotal,
                    balance: 0,
                    user: req.user.ownerId
                }], { session });
                await recalculateCustomerBalance(invoice.customer, session, req.user.ownerId);
            }
            return invoice;
        });

        res.json(result);
    } catch (error) {
        res.status(res.statusCode === 200 ? 400 : res.statusCode).json({ message: error.message });
    }
};

// @desc    Void/Cancel invoice (Soft Delete)
// @route   POST /api/invoices/:id/void
// @access  Private (Admin/Manager)
export const voidInvoice = async (req, res) => {
    try {
        const result = await runInTransaction(async (session) => {
            const { reason } = req.body;
            const invoice = await Invoice.findById(req.params.id).session(session);

            if (!invoice || invoice.user.toString() !== req.user.ownerId.toString()) {
                res.status(404);
                throw new Error('Invoice not found');
            }

            if (invoice.status === 'Void') {
                res.status(400);
                throw new Error('Invoice is already voided');
            }

            // 1. Restore Stock (Optimized with stockManager)
            if (invoice.items && invoice.items.length > 0) {
                await restoreStock(invoice.items, req.user.ownerId, session);
            }

            // 2. Revert Customer Due Balance (Cancel Debt)
            if (invoice.dueAmount > 0 && invoice.customer) {
                await Customer.findOneAndUpdate(
                    { _id: invoice.customer, user: req.user.ownerId },
                    { $inc: { balance: -invoice.dueAmount } }
                ).session(session);
            }

            // 3. Mark as Void
            invoice.status = 'Void';
            invoice.voidReason = reason || 'No reason provided';
            invoice.voidedBy = req.user._id;
            invoice.voidedAt = new Date();

            await invoice.save({ session });

            // 4. Record in Ledger (if customer exists)
            if (invoice.customer) {
                await LedgerEntry.create([{
                    customer: invoice.customer,
                    date: new Date(),
                    refType: 'Reversal',
                    refId: invoice._id,
                    refNo: invoice.invoiceNo,
                    description: `Invoice ${invoice.invoiceNo} Voided: ${reason || 'Cancelled'}`,
                    debit: 0,
                    credit: invoice.grandTotal, // Reverse the Full Sale Amount
                    balance: 0,
                    user: req.user.ownerId
                }], { session });
                await recalculateCustomerBalance(invoice.customer, session, req.user.ownerId);
            }

            return invoice;
        });

        res.json({ message: 'Invoice voided successfully', invoice: result });

    } catch (error) {
        console.error('Void Invoice Error:', error);
        res.status(res.statusCode === 200 ? 500 : res.statusCode).json({ message: error.message });
    }
};

export const deleteInvoice = async (req, res) => {
    try {
        await runInTransaction(async (session) => {
            const invoice = await Invoice.findById(req.params.id).session(session);

            if (!invoice || invoice.user.toString() !== req.user.ownerId.toString()) {
                res.status(404);
                throw new Error('Invoice not found');
            }

            // Restore customer balance if there was due amount
            if (invoice.dueAmount > 0 && invoice.customer) {
                await Customer.findByIdAndUpdate(
                    invoice.customer,
                    { $inc: { balance: -invoice.dueAmount } }
                ).session(session);
            }

            // Restore product stock (Optimized with stockManager)
            if (invoice.items && invoice.items.length > 0) {
                await restoreStock(invoice.items, req.user.ownerId, session);
            }

            await Invoice.deleteOne({ _id: invoice._id }).session(session);

            // Ledger Entry: Reversal (Credit)
            if (invoice.customer) {
                await LedgerEntry.create([{
                    customer: invoice.customer,
                    date: new Date(),
                    refType: 'Reversal',
                    refId: null, // Hard deleted, so no link
                    refNo: invoice.invoiceNo,
                    description: `Invoice ${invoice.invoiceNo} Deleted (Reversal)`,
                    debit: 0,
                    credit: invoice.grandTotal, // Reverse the Full Sale Amount
                    balance: 0,
                    user: req.user.ownerId
                }], { session });
                await recalculateCustomerBalance(invoice.customer, session, req.user.ownerId);
            }
        });

        res.json({ message: 'Invoice deleted' });
    } catch (error) {
        console.error('Delete Invoice Error:', error);
        res.status(res.statusCode === 200 ? 500 : res.statusCode).json({ message: error.message });
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
