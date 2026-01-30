import Supplier from '../models/Supplier.js';

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private/Admin
export const getSuppliers = async (req, res) => {
    try {
        const suppliers = await Supplier.find({ user: req.user.ownerId, isActive: true }).sort({ name: 1 });
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
        const { name, company, phone, email, address, gstNumber } = req.body;

        const supplier = await Supplier.create({
            name,
            company,
            phone,
            email,
            address,
            gstNumber,
            user: req.user.ownerId
        });

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

        await Supplier.findByIdAndDelete(req.params.id);
        res.json({ message: 'Supplier deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
