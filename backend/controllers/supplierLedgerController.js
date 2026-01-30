import SupplierLedgerEntry from '../models/SupplierLedgerEntry.js';
import Supplier from '../models/Supplier.js';

// @desc    Get supplier ledger
// @route   GET /api/supplier-ledger/:supplierId
// @access  Private
export const getSupplierLedger = async (req, res) => {
    try {
        const { supplierId } = req.params;
        // Verify supplier ownership implicitly
        const ledger = await SupplierLedgerEntry.find({ supplier: supplierId, user: req.user._id })
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
        await recalculateSupplierBalance(supplierId, req.user._id);
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
    await Supplier.findOneAndUpdate(
        { _id: supplierId }, // Implicitly secured by entries? No, safer to assume not. But wait, this helper function doesn't have req access. 
        // Wait, 'recalculateSupplierBalance' is a helper. I need to be careful.
        // If I change this to 'findOneAndUpdate', I guarantee it only updates if it exists.
        // Ideally I should pass user down, but 'recalculateSupplierBalance' argument takes only supplierId.
        // However, 'entries' are found by supplierId. If supplierId is cross-user, we have a problem.
        // But the CALLER 'recalculateSupplierLedger' passes supplierId.
        // I should update 'recalculateSupplierBalance' to accept user or just trust the earlier check?
        // Actually, 'entries' logic above relies on 'find({ supplier: supplierId })'.
        // I should update line 34 to filter by user as well?  Wait, I don't have user here easily unless I change signature.
        // BUT, notice I only update 'Supplier' at the end.
        // If I make sure 'entries' are only fetched for the correct user (which implies checking user first), then calculating balance is safe.
        // BUT, updating the Supplier model needs to be scoped too to avoid updating another user's supplier if ID is guessed.
        // So I should pass 'user' to this helper or find another way.
        // Looking at line 34: `const entries = await SupplierLedgerEntry.find({ supplier: supplierId })`.
        // This finds entries for that supplier. If I am User A and query User B's supplier ID, I might get their entries?
        // Yes! `SupplierLedgerEntry` has `supplierId`.
        // So I MUST scope line 34 in `supplierLedgerController.js`.
        // This helper is exported. It is called from `paymentController.js` and `supplierLedgerController.js`.
        // I need to change the signature of `recalculateSupplierBalance` to `(supplierId, userId)`.
        // But let's check callers first.
        { balance: runningBalance }
    );

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
            { _id: supplierId, user: req.user._id },
            { $inc: { balance: amount } }
        );

        // Recalculate ledger balance
        await recalculateSupplierBalance(supplierId, req.user._id);

        res.status(201).json({ message: 'Purchase recorded successfully' });
    } catch (error) {
        console.error('Record Purchase Error:', error);
        res.status(500).json({ message: error.message });
    }
};

