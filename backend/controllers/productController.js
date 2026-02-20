import Product from '../models/Product.js';
import Batch from '../models/Batch.js';
import AuditLog from '../models/AuditLog.js';

// @desc    Get all products
// @route   GET /api/products
// @access  Private (Salesman can view but cost price hidden)
export const getProducts = async (req, res) => {
    try {
        const { search, category, limit = 50, skip = 0, subCategory, subSubCategory } = req.query;
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

        if (category) filters.category = category;
        if (subCategory) filters.subCategory = subCategory;
        if (subSubCategory) filters.subSubCategory = subSubCategory;

        let query = Product.find(filters)
            .sort({ name: 1 })
            .limit(Number(limit))
            .skip(Number(skip));

        // Hide cost price for Salesman
        if (req.user.role === 'Salesman') {
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

        // Hide cost price for Salesman
        if (req.user.role === 'Salesman') {
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
// @access  Private/Admin/Accountant
export const createProduct = async (req, res) => {
    try {
        const {
            name, category, costPrice, sellingPrice, margin, gstPercent,
            isTaxInclusive, stock, sku, imei1, imei2, serialNumber,
            description, subCategory, subSubCategory, minStockAlert
        } = req.body;

        let finalSku = sku;
        if (!finalSku || finalSku.trim() === '') {
            const timestamp = Date.now().toString().slice(-6);
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            finalSku = `PROD-${timestamp}-${random}`;
        }

        const image = req.file ? `/uploads/${req.file.filename}` : req.body.image || null;

        const product = await Product.create({
            name, category, subCategory, subSubCategory,
            costPrice, sellingPrice, margin, gstPercent, isTaxInclusive,
            stock, minStockAlert, image, sku: finalSku,
            imei1, imei2, serialNumber, description,
            user: req.user.ownerId
        });

        // Audit Log
        await AuditLog.create({
            user: req.user._id,
            action: 'CREATE',
            target: 'Product',
            targetId: product._id,
            details: { name: product.name, sku: product.sku },
            ipAddress: req.ip
        });

        res.status(201).json(product);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Create products in bulk
// @route   POST /api/products/bulk
// @access  Private/Admin/Accountant
export const createProductsBulk = async (req, res) => {
    try {
        const productsData = req.body.products;
        if (!Array.isArray(productsData) || productsData.length === 0) {
            return res.status(400).json({ message: 'Invalid or empty product data array' });
        }

        const validProducts = productsData.map(p => {
            let finalSku = p.sku;
            if (!finalSku || finalSku.trim() === '') {
                const timestamp = Date.now().toString().slice(-6);
                const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
                finalSku = `PROD-${timestamp}-${random}`;
            }

            return {
                name: p.name,
                category: p.category,
                subCategory: p.subCategory || '',
                subSubCategory: p.subSubCategory || '',
                costPrice: p.costPrice || 0,
                sellingPrice: p.sellingPrice || 0,
                margin: p.margin || 0,
                gstPercent: p.gstPercent || 18,
                isTaxInclusive: p.isTaxInclusive !== undefined ? p.isTaxInclusive : true,
                stock: p.stock || 0,
                minStockAlert: p.minStockAlert || 5,
                sku: finalSku,
                imei1: p.imei1 || '',
                imei2: p.imei2 || '',
                serialNumber: p.serialNumber || '',
                description: p.description || '',
                isActive: true,
                user: req.user.ownerId,
            };
        });

        // Use insertMany for efficient bulk insertion
        const insertedProducts = await Product.insertMany(validProducts);

        // Single Bulk Audit Log
        await AuditLog.create({
            user: req.user._id,
            action: 'CREATE_BULK',
            target: 'Product',
            targetId: insertedProducts[0]?._id, // Just linking the first one as reference
            details: { count: insertedProducts.length },
            ipAddress: req.ip
        });

        res.status(201).json({ message: `Successfully imported ${insertedProducts.length} products`, count: insertedProducts.length });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin/Accountant
export const updateProduct = async (req, res) => {
    try {
        const product = await Product.findOne({ _id: req.params.id, user: req.user.ownerId });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const previousData = { name: product.name, price: product.sellingPrice, stock: product.stock };

        // Update fields
        Object.assign(product, req.body);
        if (req.file) {
            product.image = `/uploads/${req.file.filename}`;
        }

        const updatedProduct = await product.save();

        // Audit Log
        await AuditLog.create({
            user: req.user._id,
            action: 'UPDATE',
            target: 'Product',
            targetId: product._id,
            details: { previous: previousData, changes: req.body },
            ipAddress: req.ip
        });

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

        // Audit Log
        await AuditLog.create({
            user: req.user._id,
            action: 'DELETE',
            target: 'Product',
            targetId: product._id,
            details: { name: product.name, sku: product.sku },
            ipAddress: req.ip
        });

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

        // Hide cost price for Salesman
        if (req.user.role === 'Salesman') {
            query = query.select('-costPrice');
        }

        const products = await query;
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get batches for a product
// @route   GET /api/products/:id/batches
// @access  Private
export const getProductBatches = async (req, res) => {
    try {
        const batches = await Batch.find({
            product: req.params.id,
            user: req.user.ownerId,
            isActive: true,
            quantity: { $gt: 0 }
        }).sort({ expiryDate: 1 });

        res.json(batches);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get batches expiring soon
// @route   GET /api/products/expiry-alert
// @access  Private
export const getExpiringBatches = async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() + Number(days));

        const batches = await Batch.find({
            user: req.user.ownerId,
            isActive: true,
            quantity: { $gt: 0 },
            expiryDate: { $lte: cutoffDate }
        })
            .populate('product', 'name sku')
            .sort({ expiryDate: 1 });

        res.json(batches);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
