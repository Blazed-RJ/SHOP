import Product from '../models/Product.js';
import { protect, admin, staffOrAdmin } from '../middleware/auth.js';

// @desc    Get all products
// @route   GET /api/products
// @access  Private (Staff can view but cost price hidden in response)
export const getProducts = async (req, res) => {
    try {
        const { search, category, limit = 50, skip = 0, subCategory, subSubCategory } = req.query; // Destructure subCategory and subSubCategory
        let filters = { isActive: true, user: req.user.ownerId };

        if (search) {
            const searchRegex = { $regex: search, $options: 'i' };
            filters.$or = [
                { name: searchRegex },
                { sku: searchRegex },
                { imei1: searchRegex },
                { imei2: searchRegex },
                { serialNumber: searchRegex }
            ];
        }

        if (category) {
            filters.category = category;
        }

        // Add subCategory filter
        if (subCategory) {
            filters.subCategory = subCategory;
        }

        // Add subSubCategory filter
        if (subSubCategory) {
            filters.subSubCategory = subSubCategory;
        }

        let query = Product.find(filters)
            .sort({ name: 1 })
            .limit(Number(limit))
            .skip(Number(skip));

        // If user is Staff, hide cost price at DB level
        if (req.user.role === 'Staff') {
            query = query.select('-costPrice');
        }

        const products = await query;
        const total = await Product.countDocuments(filters);

        res.json({
            products,
            total,
            limit: Number(limit),
            skip: Number(skip)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
export const getProductById = async (req, res) => {
    try {
        let query = Product.findById(req.params.id);

        // Hide cost price for Staff
        if (req.user.role === 'Staff') {
            query = query.select('-costPrice');
        }

        const product = await query;

        if (!product || product.user.toString() !== req.user.ownerId.toString()) {
            return res.status(404).json({ message: 'Product not found' });
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
            margin,
            gstPercent,
            isTaxInclusive,
            stock,
            sku,
            imei1,
            imei2,
            serialNumber,
            description,
            subCategory,
            subSubCategory,
            minStockAlert
        } = req.body;

        // Auto-generate SKU if missing
        let finalSku = sku;
        if (!finalSku || finalSku.trim() === '') {
            const timestamp = Date.now().toString().slice(-6);
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            finalSku = `PROD-${timestamp}-${random}`;
        }

        console.log('📦 Creating product with categories:', { category, subCategory, subSubCategory });

        // Image path will be set if uploaded
        const image = req.file ? `/uploads/${req.file.filename}` : req.body.image || null;

        const product = await Product.create({
            name,
            category,
            subCategory,
            subSubCategory,
            costPrice,
            sellingPrice,
            margin,
            gstPercent,
            isTaxInclusive,
            stock,
            minStockAlert,
            image,
            sku: finalSku,
            imei1,
            imei2,
            serialNumber,
            description,
            user: req.user.ownerId
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
        const product = await Product.findOne({ _id: req.params.id, user: req.user.ownerId });

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
        const product = await Product.findOne({ _id: req.params.id, user: req.user.ownerId });

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

        let query = Product.find({
            isActive: true,
            user: req.user.ownerId,
            $or: [
                { name: { $regex: keyword, $options: 'i' } },
                { sku: { $regex: keyword, $options: 'i' } },
                { category: { $regex: keyword, $options: 'i' } },
                { imei1: { $regex: keyword, $options: 'i' } },
                { imei2: { $regex: keyword, $options: 'i' } },
                { serialNumber: { $regex: keyword, $options: 'i' } }
            ]
        });

        // Hide cost price for Staff
        if (req.user.role === 'Staff') {
            query = query.select('-costPrice');
        }

        const products = await query;
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
