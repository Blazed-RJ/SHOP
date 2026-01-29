import Customer from '../models/Customer.js';
import LedgerEntry from '../models/LedgerEntry.js';

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
export const getCustomers = async (req, res) => {
    try {
        const customers = await Customer.find({ isActive: true }).sort({ name: 1 });
        res.json(customers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get customer by ID
// @route   GET /api/customers/:id
// @access  Private
export const getCustomerById = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
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

        const customerExists = await Customer.findOne({ phone });

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
            balance
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
                balance: balance
            });
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
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        Object.assign(customer, req.body);
        const updatedCustomer = await customer.save();

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
            isActive: true
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
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Soft delete
        customer.isActive = false;
        await customer.save();

        res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
