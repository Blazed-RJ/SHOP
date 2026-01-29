import SupplierLedgerEntry from '../models/SupplierLedgerEntry.js';
import Supplier from '../models/Supplier.js';

// @desc    Get supplier ledger
// @route   GET /api/supplier-ledger/:supplierId
// @access  Private
export const getSupplierLedger = async (req, res) => {
    try {
        const { supplierId } = req.params;
        const ledger = await SupplierLedgerEntry.find({ supplier: supplierId })
            .sort({ date: 1, createdAt: 1 });

        res.json(ledger);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Recalculate running balance for a supplier
// @route   POST /api/supplier-ledger/recalculate/:supplierId
// @access  Private
export const recalculateSupplierLedger = async (req, res) => {
    try {
        const { supplierId } = req.params;
        await recalculateSupplierBalance(supplierId);
        res.json({ message: 'Supplier ledger recalculated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Helper: Recalculate Logic
export const recalculateSupplierBalance = async (supplierId) => {
    const entries = await SupplierLedgerEntry.find({ supplier: supplierId }).sort({ date: 1, createdAt: 1 });

    let runningBalance = 0;

    for (const entry of entries) {
        // Logic: Balance = Previous + Credit - Debit
        // (Balance represents what WE OWE the supplier)
        runningBalance = runningBalance + (entry.credit || 0) - (entry.debit || 0);

        entry.balance = runningBalance;
        await entry.save();
    }

    // Update Supplier Model Balance
    await Supplier.findByIdAndUpdate(supplierId, { balance: runningBalance });

    return runningBalance;
};

// @desc    Record a simple purchase (creates Credit entry)
// @route   POST /api/supplier-ledger/record-purchase
// @access  Private
export const recordPurchase = async (req, res) => {
    try {
        const { supplierId, amount, billNo, notes } = req.body;

        if (!supplierId || !amount || amount <= 0) {
            return res.status(400).json({ message: 'Supplier ID and valid amount are required' });
        }

        const supplier = await Supplier.findById(supplierId);
        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }

        // Generate unique bill reference
        const refNo = billNo || `PURCH-${Date.now().toString().slice(-8)}`;

        // Create supplier ledger entry (Credit - increases our liability)
        await SupplierLedgerEntry.create({
            supplier: supplierId,
            date: new Date(),
            refType: 'Purchase',
            refId: null,
            refNo: refNo,
            description: notes || 'Purchase recorded',
            debit: 0,
            credit: amount,
            balance: 0, // Will be recalculated
            billAttachment: req.file ? `/uploads/bills/${req.file.filename}` : ''
        });

        // Update supplier balance (increase what we owe)
        await Supplier.findByIdAndUpdate(supplierId, {
            $inc: { balance: amount }
        });

        // Recalculate ledger balance
        await recalculateSupplierBalance(supplierId);

        res.status(201).json({ message: 'Purchase recorded successfully' });
    } catch (error) {
        console.error('Record Purchase Error:', error);
        res.status(500).json({ message: error.message });
    }
};

