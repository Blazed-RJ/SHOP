import Product from '../models/Product.js';
import { protect, admin, staffOrAdmin } from '../middleware/auth.js';

// @desc    Get all products
// @route   GET /api/products
// @access  Private (Staff can view but cost price hidden in response)
export const getProducts = async (req, res) => {
    try {
        const products = await Product.find({ isActive: true, user: req.user._id });

        // If user is Staff, hide cost price
        if (req.user.role === 'Staff') {
            const productsWithoutCost = products.map(product => {
                const { costPrice, ...productWithoutCost } = product.toObject();
                return productWithoutCost;
            });
            return res.json(productsWithoutCost);
        }

        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Hide cost price for Staff
        if (req.user.role === 'Staff') {
            const { costPrice, ...productWithoutCost } = product.toObject();
            return res.json(productWithoutCost);
        }

        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
    try {
        const {
            name,
            category,
            costPrice,
            sellingPrice,
            gstPercent,
            isTaxInclusive,
            stock,
            imei1,
            imei2,
            serialNo,
            description
        } = req.body;

        // Image path will be set if uploaded
        const image = req.file ? `/uploads/${req.file.filename}` : null;

        const product = await Product.create({
            name,
            category,
            costPrice,
            sellingPrice,
            gstPercent,
            isTaxInclusive,
            stock,
            image,
            imei1,
            imei2,
            serialNo,
            description,
            user: req.user._id
        });

        res.status(201).json(product);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
    try {
        const product = await Product.findOne({ _id: req.params.id, user: req.user._id });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Update fields
        Object.assign(product, req.body);

        // Update image if new file uploaded
        if (req.file) {
            product.image = `/uploads/${req.file.filename}`;
        }

        const updatedProduct = await product.save();
        res.json(updatedProduct);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete product (soft delete)
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findOne({ _id: req.params.id, user: req.user._id });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        product.isActive = false;
        await product.save();

        res.json({ message: 'Product removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Search products
// @route   GET /api/products/search/:keyword
// @access  Private
export const searchProducts = async (req, res) => {
    try {
        const keyword = req.params.keyword;

        const products = await Product.find({
            isActive: true,
            user: req.user._id,
            $or: [
                { name: { $regex: keyword, $options: 'i' } },
                { category: { $regex: keyword, $options: 'i' } },
                { imei1: { $regex: keyword, $options: 'i' } },
                { imei2: { $regex: keyword, $options: 'i' } },
                { serialNo: { $regex: keyword, $options: 'i' } }
            ]
        });

        // Hide cost price for Staff
        if (req.user.role === 'Staff') {
            const productsWithoutCost = products.map(product => {
                const { costPrice, ...productWithoutCost } = product.toObject();
                return productWithoutCost;
            });
            return res.json(productsWithoutCost);
        }

        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
