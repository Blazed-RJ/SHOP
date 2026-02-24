import LedgerEntry from '../models/LedgerEntry.js';
import AccountGroup from '../models/AccountGroup.js';
import AccountLedger from '../models/AccountLedger.js';
import AuditLog from '../models/AuditLog.js';

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
export const getCustomers = async (req, res) => {
    try {
        const { search, limit = 50, skip = 0 } = req.query;
        let filters = { isActive: true, isDeleted: { $ne: true }, user: req.user.ownerId };

        if (search) {
            filters.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const customers = await Customer.find(filters)
            .sort({ name: 1 })
            .limit(Number(limit))
            .skip(Number(skip));

        const total = await Customer.countDocuments(filters);

        res.json({
            customers,
            total,
            limit: Number(limit),
            skip: Number(skip)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get customer by ID
// @route   GET /api/customers/:id
// @access  Private
export const getCustomerById = async (req, res) => {
    try {
        // Only same owner
        const customer = await Customer.findById(req.params.id);

        if (!customer || customer.user.toString() !== req.user.ownerId.toString()) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.json(customer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create customer
// @route   POST /api/customers
// @access  Private
export const createCustomer = async (req, res) => {
    try {
        const { name, phone, email, address, gstNumber, initialBalance } = req.body;

        const customerExists = await Customer.findOne({ phone, user: req.user.ownerId });

        if (customerExists) {
            return res.status(400).json({ message: 'Customer with this phone already exists' });
        }

        const balance = initialBalance ? Number(initialBalance) : 0;

        const customer = await Customer.create({
            name,
            phone,
            email,
            address,
            gstNumber,
            balance,
            user: req.user.ownerId
        });

        // Ledger Entry: Opening Balance
        if (balance !== 0) {
            await LedgerEntry.create({
                customer: customer._id,
                date: new Date(),
                refType: 'Opening Balance',
                refId: null,
                refNo: 'OPENING',
                description: 'Opening Balance',
                debit: balance > 0 ? balance : 0, // Positive = Debt/Udhaar (Debit)
                credit: balance < 0 ? Math.abs(balance) : 0, // Negative = Advance (Credit)
                balance: balance,
                user: req.user.ownerId
            });
        }

        // Sync with Accounting System
        try {
            const debtorsGroup = await AccountGroup.findOne({ name: 'Sundry Debtors' });
            if (debtorsGroup) {
                // Check for name availability
                let ledgerName = name;
                const existingLedger = await AccountLedger.findOne({ name: ledgerName });
                if (existingLedger) {
                    ledgerName = `${name} (${phone.slice(-4)})`;
                }

                await AccountLedger.create({
                    name: ledgerName,
                    group: debtorsGroup._id,
                    openingBalance: balance > 0 ? balance : Math.abs(balance), // Absolute value
                    openingBalanceType: balance >= 0 ? 'Dr' : 'Cr',
                    currentBalance: balance, // Dr is positive in net logic
                    balanceType: balance >= 0 ? 'Dr' : 'Cr',
                    linkedType: 'Customer',
                    linkedId: customer._id,
                    gstNumber,
                    mobile: phone,
                    email,
                    address
                });
            }
        } catch (err) {
            console.error("Failed to create AccountLedger for customer:", err);
            // Don't fail the request, just log it. 
            // Ideally we should have a transaction but MongoDB transactions require replica set.
        }

        res.status(201).json(customer);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
export const updateCustomer = async (req, res) => {
    try {
        const customer = await Customer.findOne({ _id: req.params.id, user: req.user.ownerId });

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        Object.assign(customer, req.body);
        const updatedCustomer = await customer.save();

        // Sync Accounting Ledger
        try {
            const ledger = await AccountLedger.findOne({ linkedType: 'Customer', linkedId: customer._id });
            if (ledger) {
                if (req.body.name) ledger.name = req.body.name; // Might cause duplicate error if strictly unique, but ignoring for now
                if (req.body.gstNumber) ledger.gstNumber = req.body.gstNumber;
                if (req.body.phone) ledger.mobile = req.body.phone;
                if (req.body.email) ledger.email = req.body.email;
                if (req.body.address) ledger.address = req.body.address;
                await ledger.save();
            }
        } catch (err) {
            console.error("Failed to update AccountLedger:", err);
        }

        res.json(updatedCustomer);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get customers with outstanding balance (Udhaar)
// @route   GET /api/customers/dues
// @access  Private
export const getCustomersWithDues = async (req, res) => {
    try {
        const customers = await Customer.find({
            balance: { $gt: 0 },
            isActive: true,
            isDeleted: { $ne: true },
            user: req.user.ownerId
        }).sort({ balance: -1 });

        res.json(customers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Delete customer (Soft delete)
// @route   DELETE /api/customers/:id
// @access  Private
export const deleteCustomer = async (req, res) => {
    try {
        const customer = await Customer.findOne({ _id: req.params.id, user: req.user.ownerId });

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Optional: Check if customer has balance
        if (Math.abs(customer.balance) > 0.1) {
            return res.status(400).json({ message: 'Cannot delete customer with active balance' });
        }

        // Soft delete
        customer.isDeleted = true;
        customer.deletedAt = new Date();
        await customer.save();

        // Audit Log
        AuditLog.create({
            user: req.user._id,
            action: 'DELETE',
            target: 'Customer',
            targetId: customer._id,
            details: { name: customer.name, phone: customer.phone },
            ipAddress: req.ip,
            device: req.headers['user-agent']
        }).catch(err => console.error('AuditLog Error:', err.message));

        res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Get deleted customers (Trash)
// @route   GET /api/customers/trash
// @access  Private/Admin
export const getDeletedCustomers = async (req, res) => {
    try {
        const { search, limit = 50, skip = 0 } = req.query;
        let filters = { isDeleted: true, user: req.user.ownerId };

        if (search) {
            filters.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        const [customers, total] = await Promise.all([
            Customer.find(filters).sort({ deletedAt: -1 }).limit(Number(limit)).skip(Number(skip)),
            Customer.countDocuments(filters)
        ]);

        res.json({ customers, total, limit, skip });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Restore specific customer from Trash
// @route   PUT /api/customers/:id/restore
// @access  Private/Admin
export const restoreCustomer = async (req, res) => {
    try {
        const customer = await Customer.findOne({ _id: req.params.id, user: req.user.ownerId, isDeleted: true });

        if (!customer) {
            return res.status(404).json({ message: 'Deleted customer not found' });
        }

        customer.isDeleted = false;
        customer.deletedAt = null;
        await customer.save();

        AuditLog.create({
            user: req.user._id,
            action: 'RESTORE',
            target: 'Customer',
            targetId: customer._id,
            details: { name: customer.name, phone: customer.phone },
            ipAddress: req.ip,
            device: req.headers['user-agent']
        }).catch(err => console.error('AuditLog Error:', err.message));

        res.json({ message: 'Customer restored successfully', customer });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
