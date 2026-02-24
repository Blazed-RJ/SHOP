import Supplier from '../models/Supplier.js';
import AccountGroup from '../models/AccountGroup.js';
import AccountLedger from '../models/AccountLedger.js';
import AuditLog from '../models/AuditLog.js';

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private/Admin
export const getSuppliers = async (req, res) => {
    try {
        const suppliers = await Supplier.find({ user: req.user.ownerId, isActive: true, isDeleted: { $ne: true } }).sort({ name: 1 });
        res.json(suppliers);
    } catch (error) {
        res.status(500).json({ message: error.message });
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
        const { name, company, phone, email, address, gstNumber, type } = req.body;

        const supplier = await Supplier.create({
            name,
            company,
            phone,
            email,
            address,
            gstNumber,
            type,
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
