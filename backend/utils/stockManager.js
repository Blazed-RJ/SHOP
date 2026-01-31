/**
 * Stock Manager Utility
 * Centralized stock validation and operations
 */

import Product from '../models/Product.js';
import { StockError } from './errorHandler.js';

/**
 * Validate stock availability for invoice items
 * @param {Array} items - Invoice items to validate
 * @param {String} userId - Owner/User ID
 * @param {Object} session - Optional MongoDB session
 * @returns {Promise<Object>} - { valid: boolean, errors: Array }
 */
export const validateStockAvailability = async (items, userId, session = null) => {
    const errors = [];
    const productIds = items
        .filter(item => item.productId)
        .map(item => item.productId);

    if (productIds.length === 0) {
        // No product-based items, all manual entries
        return { valid: true, errors: [] };
    }

    // Fetch all required products in one query
    const query = { _id: { $in: productIds }, user: userId };
    const products = session
        ? await Product.find(query).session(session)
        : await Product.find(query);

    // Create lookup map for fast access
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    // Validate each item
    for (const item of items) {
        if (!item.productId) continue; // Skip manual entries

        const productId = item.productId.toString();
        const product = productMap.get(productId);

        if (!product) {
            errors.push({
                item: item.itemName || item.name,
                productId,
                error: 'Product not found or does not belong to this user'
            });
            continue;
        }

        // Check stock availability
        const currentStock = product.stock || 0;
        const requestedQty = item.quantity || 0;

        if (currentStock < requestedQty) {
            errors.push({
                item: product.name,
                productId,
                requested: requestedQty,
                available: currentStock,
                error: `Insufficient stock: requested ${requestedQty}, available ${currentStock}`
            });
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
};

/**
 * Update stock for invoice items (bulk operation)
 * @param {Array} items - Invoice items
 * @param {String} userId - Owner/User ID
 * @param {Number} multiplier - 1 for deduction, -1 for restoration
 * @param {Object} session - Optional MongoDB session
 */
export const updateStockBulk = async (items, userId, multiplier = 1, session = null) => {
    const bulkOps = items
        .filter(item => item.productId && item.quantity)
        .map(item => ({
            updateOne: {
                filter: { _id: item.productId, user: userId },
                update: { $inc: { stock: -(item.quantity * multiplier) } }
            }
        }));

    if (bulkOps.length === 0) {
        return { modified: 0 };
    }

    const options = session ? { session } : {};
    const result = await Product.bulkWrite(bulkOps, options);

    return {
        modified: result.modifiedCount,
        matched: result.matchedCount
    };
};

/**
 * Restore stock for invoice items (used in void/delete)
 * @param {Array} items - Invoice items
 * @param {String} userId - Owner/User ID  
 * @param {Object} session - Optional MongoDB session
 */
export const restoreStock = async (items, userId, session = null) => {
    return await updateStockBulk(items, userId, -1, session);
};

/**
 * Deduct stock for invoice items (used in creation)
 * @param {Array} items - Invoice items
 * @param {String} userId - Owner/User ID
 * @param {Object} session - Optional MongoDB session
 */
export const deductStock = async (items, userId, session = null) => {
    return await updateStockBulk(items, userId, 1, session);
};

/**
 * Format stock validation errors for user-friendly display
 * @param {Array} errors - Array of stock errors
 * @returns {String} - Formatted error message
 */
export const formatStockErrors = (errors) => {
    if (errors.length === 0) return '';

    const messages = errors.map(err => {
        if (err.available !== undefined) {
            return `${err.item}: Need ${err.requested}, only ${err.available} available`;
        }
        return `${err.item}: ${err.error}`;
    });

    return `Stock validation failed:\n${messages.join('\n')}`;
};
