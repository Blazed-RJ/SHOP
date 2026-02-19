
/**
 * Stock Manager Utility
 * Centralized stock validation and operations
 */

import Product from '../models/Product.js';
import Batch from '../models/Batch.js';
import Invoice from '../models/Invoice.js';
import { StockError } from './errorHandler.js';

/**
 * Validate stock availability (Basic: Only checks Total Stock for now)
 * To be strict, we would check Batch stock if batchNumber provided.
 */
export const validateStockAvailability = async (items, userId, session = null) => {
    const errors = [];
    const productIds = items.filter(item => item.productId).map(item => item.productId);

    if (productIds.length === 0) return { valid: true, errors: [] };

    const query = { _id: { $in: productIds }, user: userId };
    const products = session ? await Product.find(query).session(session) : await Product.find(query);
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    for (const item of items) {
        if (!item.productId) continue;
        const product = productMap.get(item.productId.toString());

        if (!product) {
            errors.push({ item: item.itemName || 'Item', error: 'Product not found' });
            continue;
        }

        const requested = parseFloat(item.quantity) || 0;
        const available = parseFloat(product.stock) || 0;

        if (available < requested) {
            errors.push({
                item: product.name,
                requested,
                available,
                error: `Insufficient stock`
            });
        }
    }

    return { valid: errors.length === 0, errors };
};

/**
 * Deduct stock (and Batches if tracked)
 */
export const deductStock = async (items, userId, session = null, invoiceId = null) => {
    const options = session ? { session } : {};

    // 1. Get all products
    const productIds = items.filter(i => i.productId).map(i => i.productId);
    const products = await Product.find({ _id: { $in: productIds } }).session(session);
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    for (const item of items) {
        if (!item.productId) continue;
        const product = productMap.get(item.productId.toString());
        if (!product) continue;

        const qtyToDeduct = parseFloat(item.quantity);

        // A. General Stock Deduction
        product.stock -= qtyToDeduct;
        await product.save(options);

        // B. Batch Deduction
        if (product.isBatchTracked) {
            if (item.batchNumber) {
                // Specific Batch Requested
                await Batch.findOneAndUpdate(
                    { product: product._id, batchNumber: item.batchNumber, user: userId },
                    { $inc: { quantity: -qtyToDeduct } },
                    options
                );
            } else {
                // Auto-Pick (FEFO)
                // Find batches with quantity > 0, sorted by expiry
                const batches = await Batch.find({
                    product: product._id,
                    user: userId,
                    quantity: { $gt: 0 },
                    isActive: true
                }).sort({ expiryDate: 1 }).session(session);

                let remaining = qtyToDeduct;
                let usedBatch = null;

                for (const batch of batches) {
                    if (remaining <= 0) break;

                    const take = Math.min(batch.quantity, remaining);
                    batch.quantity -= take;
                    remaining -= take;
                    await batch.save(options);

                    if (!usedBatch) usedBatch = batch.batchNumber; // Record primary batch
                }

                // If invoiceId provided, update the Invoice Item with the batch used (Best Effort)
                if (invoiceId && usedBatch) {
                    await Invoice.updateOne(
                        { _id: invoiceId, "items.productId": product._id },
                        { $set: { "items.$.batchNumber": usedBatch } }, // Updates first match, which is okay for now
                        options
                    );
                }
            }
        }
    }
};

/**
 * Restore stock (Reverse of deduct)
 */
export const restoreStock = async (items, userId, session = null) => {
    const options = session ? { session } : {};

    // 1. Products
    const productIds = items.filter(i => i.productId).map(i => i.productId);
    const products = await Product.find({ _id: { $in: productIds } }).session(session);
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    for (const item of items) {
        if (!item.productId) continue;
        const product = productMap.get(item.productId.toString());
        if (!product) continue;

        const qtyToRestore = parseFloat(item.quantity);

        // A. General Stock
        product.stock += qtyToRestore;
        await product.save(options);

        // B. Batch Restore
        if (product.isBatchTracked && item.batchNumber) {
            await Batch.findOneAndUpdate(
                { product: product._id, batchNumber: item.batchNumber, user: userId },
                { $inc: { quantity: qtyToRestore } },
                options
            );
        } else if (product.isBatchTracked) {
            // If no batch recorded, restore to a "General" or "Unknown" batch, or just skip batch logic?
            // Ideally we should find the most recent batch and add it there, or create an "Adj" batch.
            // For now, we skip batch restore if unknown, to avoid corrupting specific batches.
            // User can manually adjust stock if needed.
        }
    }
};

export const formatStockErrors = (errors) => {
    return errors.map(e => `${e.item}: ${e.error}`).join('\n');
};
