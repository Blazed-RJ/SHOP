import Product from '../models/Product.js';
import Batch from '../models/Batch.js';
import AuditLog from '../models/AuditLog.js';

// Helper for regex escaping to prevent ReDoS and regex errors
const escapeRegex = (text) => text.toString().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

// @desc    Get all products
// @route   GET /api/products
// @access  Private (Salesman can view but cost price hidden)
export const getProducts = async (req, res) => {
    try {
        const { search, category, limit = 50, skip = 0, subCategory, subSubCategory } = req.query;
        let filters = { isActive: true, user: req.user.ownerId };

        const parsedLimit = Math.min(Math.max(Number(limit) || 50, 1), 2000);
        const parsedSkip = Math.max(Number(skip) || 0, 0);

        if (search) {
            const safeSearch = escapeRegex(search);
            const searchRegex = { $regex: safeSearch, $options: 'i' };
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
            .limit(parsedLimit)
            .skip(parsedSkip);

        // Hide cost price for Salesman
        if (req.user.role === 'Salesman') {
            query = query.select('-costPrice');
        }

        // Execute query and count concurrently for performance
        const [products, total] = await Promise.all([
            query,
            Product.countDocuments(filters)
        ]);

        res.json({
            products,
            total,
            limit: parsedLimit,
            skip: parsedSkip
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
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid Product ID format' });
        }
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

        let finalSku = sku ? String(sku).trim() : '';
        if (!finalSku) {
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

        // Audit Log (non-blocking)
        AuditLog.create({
            user: req.user._id,
            action: 'CREATE',
            target: 'Product',
            targetId: product._id,
            details: { name: product.name, sku: product.sku },
            ipAddress: req.ip
        }).catch(err => console.error('AuditLog Error:', err.message));

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

        const validProducts = [];
        for (const p of productsData) {
            if (!p || typeof p !== 'object') continue;

            let finalSku = p.sku ? String(p.sku).trim() : '';
            if (!finalSku) {
                const timestamp = Date.now().toString().slice(-6);
                const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
                finalSku = `PROD-${timestamp}-${random}`;
            }

            validProducts.push({
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
            });
        }

        if (validProducts.length === 0) {
            return res.status(400).json({ message: 'No valid product objects provided' });
        }

        // Use insertMany for efficient bulk insertion
        const insertedProducts = await Product.insertMany(validProducts);

        // Single Bulk Audit Log (non-blocking)
        AuditLog.create({
            user: req.user._id,
            action: 'CREATE_BULK',
            target: 'Product',
            targetId: insertedProducts[0]?._id, // Just linking the first one as reference
            details: { count: insertedProducts.length },
            ipAddress: req.ip
        }).catch(err => console.error('AuditLog Error:', err.message));

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

        // Prevent mass assignment of sensitive database fields
        delete req.body._id;
        delete req.body.user;
        delete req.body.isActive;

        // Update fields
        Object.assign(product, req.body);
        if (req.file) {
            product.image = `/uploads/${req.file.filename}`;
        }

        const updatedProduct = await product.save();

        // Audit Log (non-blocking)
        AuditLog.create({
            user: req.user._id,
            action: 'UPDATE',
            target: 'Product',
            targetId: product._id,
            details: { previous: previousData, changes: req.body },
            ipAddress: req.ip
        }).catch(err => console.error('AuditLog Error:', err.message));

        res.json(updatedProduct);
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid Product ID format' });
        }
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

        // Audit Log (non-blocking)
        AuditLog.create({
            user: req.user._id,
            action: 'DELETE',
            target: 'Product',
            targetId: product._id,
            details: { name: product.name, sku: product.sku },
            ipAddress: req.ip
        }).catch(err => console.error('AuditLog Error:', err.message));

        res.json({ message: 'Product removed' });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid Product ID format' });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete products in bulk (soft delete)
// @route   POST /api/products/bulk-delete
// @access  Private/Admin
export const deleteProductsBulk = async (req, res) => {
    try {
        const { productIds } = req.body;

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({ message: 'No product IDs provided' });
        }

        const validProducts = await Product.find({ _id: { $in: productIds }, user: req.user.ownerId });

        if (validProducts.length === 0) {
            return res.status(404).json({ message: 'No valid products found to delete' });
        }

        // Soft delete all matched
        await Product.updateMany(
            { _id: { $in: validProducts.map(p => p._id) } },
            { $set: { isActive: false } }
        );

        // Audit Log (non-blocking)
        AuditLog.create({
            user: req.user._id,
            action: 'DELETE_BULK',
            target: 'Product',
            targetId: validProducts[0]._id, // logging first one as reference
            details: { count: validProducts.length, ids: validProducts.map(p => p._id) },
            ipAddress: req.ip
        }).catch(err => console.error('AuditLog Error:', err.message));

        res.json({ message: `Successfully deleted ${validProducts.length} products`, count: validProducts.length });
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
        if (!keyword) return res.json([]);
        const safeKeyword = escapeRegex(keyword);

        let query = Product.find({
            isActive: true,
            user: req.user.ownerId,
            $or: [
                { name: { $regex: safeKeyword, $options: 'i' } },
                { sku: { $regex: safeKeyword, $options: 'i' } },
                { category: { $regex: safeKeyword, $options: 'i' } },
                { imei1: { $regex: safeKeyword, $options: 'i' } },
                { imei2: { $regex: safeKeyword, $options: 'i' } },
                { serialNumber: { $regex: safeKeyword, $options: 'i' } }
            ]
        }).limit(20); // Add strict limit for search dropdowns

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
