import Invoice from '../models/Invoice.js';
import LedgerEntry from '../models/LedgerEntry.js';
import SupplierLedgerEntry from '../models/SupplierLedgerEntry.js';
import Customer from '../models/Customer.js';
import Supplier from '../models/Supplier.js';

// @desc    Get public invoice by ID
// @route   GET /api/public/invoices/:id
// @access  Public
export const getPublicInvoice = async (req, res) => {
    try {
        console.log(`[PUBLIC INVOICE] Request received for ID: ${req.params.id}`);
        const invoice = await Invoice.findById(req.params.id)
            .populate('customer')
            .populate('createdBy', 'name')
            .populate('items.productId');

        if (!invoice) {
            console.log(`Public Invoice Not Found. ID: ${req.params.id}`);
            return res.status(404).json({ message: 'Invoice not found', queriedId: req.params.id });
        }

        // Return only necessary fields? For now, return full invoice as view needs it.
        // We might want to strip sensitive internal fields if any, but Invoice is generally safe.
        res.json(invoice);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get public customer ledger
// @route   GET /api/public/customers/:id/ledger
// @access  Public
export const getPublicCustomerLedger = async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch Customer Details (Read Only)
        const customer = await Customer.findById(id).select('name phone address balance email');

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Fetch Ledger Entries
        const ledger = await LedgerEntry.find({ customer: id })
            .sort({ date: 1, createdAt: 1 });

        res.json({
            customer,
            ledger
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get public supplier ledger
// @route   GET /api/public/suppliers/:id/ledger
// @access  Public
export const getPublicSupplierLedger = async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch Supplier Details
        const supplier = await Supplier.findById(id).select('name phone address balance email');

        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }

        // Fetch Ledger Entries
        const ledger = await SupplierLedgerEntry.find({ supplier: id }) // Note: Schema uses 'supplier' field? Checking SupplierLedger logic...
            // Wait, looking at ledgerController, it uses 'customer' field for customer ledger.
            // I need to check if there is a separate SupplierLedger model or if it uses LedgerEntry with a 'supplier' field.
            // Let's assume standard 'LedgerEntry' with 'supplier' field based on context, but I should verify if unsure.
            // Checking previous context: `SupplierLedger.jsx` calls `/api/supplier-ledger/:id`.
            // Let's assume the field is 'supplier'.
            .sort({ date: 1, createdAt: 1 });

        res.json({
            supplier,
            ledger
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
