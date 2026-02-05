import SupplierLedgerEntry from '../models/SupplierLedgerEntry.js';
import Supplier from '../models/Supplier.js';

// @desc    Get supplier ledger
// @route   GET /api/supplier-ledger/:supplierId
// @access  Private
export const getSupplierLedger = async (req, res) => {
    try {
        const { supplierId } = req.params;
        // Verify supplier ownership implicitly
        const ledger = await SupplierLedgerEntry.find({ supplier: supplierId, user: req.user.ownerId })
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
        await recalculateSupplierBalance(supplierId, req.user.ownerId);
        res.json({ message: 'Supplier ledger recalculated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Helper: Recalculate Logic
export const recalculateSupplierBalance = async (supplierId, userId = null) => {
    const filter = { supplier: supplierId };
    if (userId) filter.user = userId; // Secure if userId provided

    const entries = await SupplierLedgerEntry.find(filter).sort({ date: 1, createdAt: 1 });

    let runningBalance = 0;
    const bulkOps = [];

    for (const entry of entries) {
        // Logic: Balance = Previous + Credit - Debit
        runningBalance = runningBalance + (entry.credit || 0) - (entry.debit || 0);

        // Only update if balance is different
        if (Math.abs(entry.balance - runningBalance) > 0.001) {
            bulkOps.push({
                updateOne: {
                    filter: { _id: entry._id },
                    update: { $set: { balance: runningBalance } }
                }
            });
        }
    }

    if (bulkOps.length > 0) {
        await SupplierLedgerEntry.bulkWrite(bulkOps);
    }

    // Update Supplier Model Balance
    const supplierFilter = { _id: supplierId };
    if (userId) supplierFilter.user = userId;

    await Supplier.findOneAndUpdate(supplierFilter, { balance: runningBalance });

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
            billAttachment: req.file ? `/uploads/bills/${req.file.filename}` : '',
            user: req.user._id
        });

        // Update supplier balance (increase what we owe)
        await Supplier.findOneAndUpdate(
            { _id: supplierId, user: req.user.ownerId },
            { $inc: { balance: amount } }
        );

        // Recalculate ledger balance
        await recalculateSupplierBalance(supplierId, req.user.ownerId);

        res.status(201).json({ message: 'Purchase recorded successfully' });
    } catch (error) {
        console.error('Record Purchase Error:', error);
        res.status(500).json({ message: error.message });
    }
};


// @desc    Update ledger entry
// @route   PUT /api/supplier-ledger/:id
// @access  Private
export const updateLedgerEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const { date, description, refNo, debit, credit } = req.body;

        const entry = await SupplierLedgerEntry.findById(id);

        if (!entry) {
            return res.status(404).json({ message: 'Entry not found' });
        }

        // Verify ownership
        if (entry.user.toString() !== req.user.ownerId.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

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
        // NOTE: We generally expect either debit OR credit to be positive, not both.
        // If both passed, we respect the values appropriately.
        if (debit !== undefined) entry.debit = parseFloat(debit) || 0;
        if (credit !== undefined) entry.credit = parseFloat(credit) || 0;

        await entry.save();

        // Trigger Recalculation due to amount change
        await recalculateSupplierBalance(entry.supplier, req.user.ownerId);

        res.json(entry);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete ledger entry
// @route   DELETE /api/supplier-ledger/:id
// @access  Private
export const deleteLedgerEntry = async (req, res) => {
    try {
        const { id } = req.params;

        const entry = await SupplierLedgerEntry.findById(id);

        if (!entry) {
            return res.status(404).json({ message: 'Entry not found' });
        }

        // Verify ownership
        if (entry.user.toString() !== req.user.ownerId.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const supplierId = entry.supplier;

        await SupplierLedgerEntry.deleteOne({ _id: id });

        // Recalculate balance
        await recalculateSupplierBalance(supplierId, req.user.ownerId);

        res.json({ message: 'Entry deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
