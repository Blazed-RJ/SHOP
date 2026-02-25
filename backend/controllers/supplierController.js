import Supplier from '../models/Supplier.js';
import AccountGroup from '../models/AccountGroup.js';
import AccountLedger from '../models/AccountLedger.js';
import AuditLog from '../models/AuditLog.js';

// @desc    Get all suppliers (type = 'Supplier' only)
// @route   GET /api/suppliers
// @access  Private/Admin
export const getSuppliers = async (req, res) => {
    try {
        const suppliers = await Supplier.find({
            user: req.user.ownerId,
            type: 'Supplier',
            isActive: true,
            isDeleted: { $ne: true }
        }).sort({ name: 1 });
        res.json(suppliers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all expense heads (type = 'Expense' only)
// @route   GET /api/suppliers/expense-heads
// @access  Private
export const getExpenseHeads = async (req, res) => {
    try {
        const heads = await Supplier.find({
            user: req.user.ownerId,
            type: 'Expense',
            isActive: true,
            isDeleted: { $ne: true }
        }).sort({ name: 1 });
        res.json(heads);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Helper: compute next due date from autopay config
const computeNextDue = (frequency, dueDay, fromDate = new Date()) => {
    const d = new Date(fromDate);
    if (frequency === 'Monthly') {
        // Next occurrence of dueDay in current or next month
        d.setDate(dueDay);
        if (d <= fromDate) d.setMonth(d.getMonth() + 1);
    } else if (frequency === 'Weekly') {
        // dueDay is 0 (Sun) - 6 (Sat)
        const diff = (dueDay - d.getDay() + 7) % 7 || 7;
        d.setDate(d.getDate() + diff);
    } else if (frequency === 'Yearly') {
        d.setMonth(0); d.setDate(dueDay);
        if (d <= fromDate) d.setFullYear(d.getFullYear() + 1);
    }
    d.setHours(0, 0, 0, 0);
    return d;
};

// @desc    Create expense head
// @route   POST /api/suppliers/expense-heads
// @access  Private
export const createExpenseHead = async (req, res) => {
    try {
        const { name, autopay } = req.body;
        const autopayData = {
            enabled: autopay?.enabled || false,
            amount: autopay?.amount || 0,
            frequency: autopay?.frequency || 'Monthly',
            dueDay: autopay?.dueDay || 1,
            method: autopay?.method || 'Cash',
            lastPaid: null,
            nextDue: autopay?.enabled
                ? computeNextDue(autopay.frequency || 'Monthly', autopay.dueDay || 1)
                : null
        };

        const head = await Supplier.create({
            name,
            type: 'Expense',
            phone: null,
            user: req.user.ownerId,
            autopay: autopayData
        });
        res.status(201).json(head);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get supplier by ID
// @route   GET /api/suppliers/:id
// @access  Private/Admin
export const getSupplierById = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);

        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }

        // Check ownership
        if (supplier.user?.toString() !== req.user.ownerId.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        res.json(supplier);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create supplier
// @route   POST /api/suppliers
// @access  Private/Admin
export const createSupplier = async (req, res) => {
    try {
        const { name, company, phone, email, address, gstNumber } = req.body;

        const supplier = await Supplier.create({
            name,
            company,
            phone,
            email,
            address,
            gstNumber,
            type: 'Supplier', // Always force Supplier type on this endpoint
            user: req.user.ownerId
        });

        // Sync with Accounting System
        try {
            const creditorsGroup = await AccountGroup.findOne({ name: 'Sundry Creditors' });
            if (creditorsGroup) {
                let ledgerName = name;
                const existingLedger = await AccountLedger.findOne({ name: ledgerName });
                if (existingLedger) {
                    ledgerName = `${name} (${phone?.slice(-4) || 'SUP'})`;
                }

                // Suppliers: We owe them (Credit balance). 
                // Initial balance for supplier is usually 0 unless opening balance logic exists?
                // The current Supplier model doesn't explicitly take 'initialBalance' in create?
                // Wait, it just has 'balance' default 0.
                // Assuming 0 for now.

                await AccountLedger.create({
                    name: ledgerName,
                    group: creditorsGroup._id,
                    openingBalance: 0,
                    openingBalanceType: 'Cr',
                    currentBalance: 0,
                    balanceType: 'Cr',
                    linkedType: 'Supplier',
                    linkedId: supplier._id,
                    gstNumber,
                    mobile: phone,
                    email,
                    address
                });
            }
        } catch (err) {
            console.error("Failed to create AccountLedger for supplier:", err);
        }

        res.status(201).json(supplier);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Private/Admin
export const updateSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);

        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }

        // Check ownership
        if (supplier.user?.toString() !== req.user.ownerId.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        Object.assign(supplier, req.body);
        const updatedSupplier = await supplier.save();

        // Sync Accounting Ledger
        try {
            const ledger = await AccountLedger.findOne({ linkedType: 'Supplier', linkedId: supplier._id });
            if (ledger) {
                if (req.body.name) ledger.name = req.body.name;
                if (req.body.gstNumber) ledger.gstNumber = req.body.gstNumber;
                if (req.body.phone) ledger.mobile = req.body.phone;
                if (req.body.email) ledger.email = req.body.email;
                if (req.body.address) ledger.address = req.body.address;
                await ledger.save();
            }
        } catch (err) {
            console.error("Failed to update AccountLedger:", err);
        }

        res.json(updatedSupplier);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
// @access  Private/Admin
export const deleteSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);

        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }

        // Check ownership
        if (supplier.user.toString() !== req.user.ownerId.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Check if supplier has balance
        if (Math.abs(supplier.balance) > 0.1) {
            return res.status(400).json({ message: 'Cannot delete supplier with active balance' });
        }

        // Soft delete
        supplier.isDeleted = true;
        supplier.deletedAt = new Date();
        await supplier.save();

        // Audit Log
        AuditLog.create({
            user: req.user._id,
            action: 'DELETE',
            target: 'Supplier',
            targetId: supplier._id,
            details: { name: supplier.name, phone: supplier.phone },
            ipAddress: req.ip
        }).catch(err => console.error('AuditLog Error:', err.message));

        res.json({ message: 'Supplier deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Get deleted suppliers (Trash)
// @route   GET /api/suppliers/trash
// @access  Private/Admin
export const getDeletedSuppliers = async (req, res) => {
    try {
        const suppliers = await Supplier.find({ user: req.user.ownerId, isDeleted: true }).sort({ name: 1 });
        res.json(suppliers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Restore specific supplier from Trash
// @route   PUT /api/suppliers/:id/restore
// @access  Private/Admin
export const restoreSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findOne({ _id: req.params.id, user: req.user.ownerId, isDeleted: true });

        if (!supplier) {
            return res.status(404).json({ message: 'Deleted supplier not found' });
        }

        supplier.isDeleted = false;
        supplier.deletedAt = null;
        await supplier.save();

        AuditLog.create({
            user: req.user._id,
            action: 'RESTORE',
            target: 'Supplier',
            targetId: supplier._id,
            details: { name: supplier.name, phone: supplier.phone },
            ipAddress: req.ip,
            device: req.headers['user-agent']
        }).catch(err => console.error('AuditLog Error:', err.message));

        res.json({ message: 'Supplier restored successfully', supplier });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
