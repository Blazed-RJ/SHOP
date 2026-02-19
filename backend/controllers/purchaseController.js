
import Supplier from '../models/Supplier.js';
import SupplierLedgerEntry from '../models/SupplierLedgerEntry.js';
import Product from '../models/Product.js';
import Batch from '../models/Batch.js';
import { recalculateSupplierBalance } from './supplierLedgerController.js';

// @desc    Create a new Purchase (Stock Inward)
// @route   POST /api/purchases
// @access  Private
// @scope   Owner Only (for now)
export const createPurchase = async (req, res) => {
    try {
        const {
            supplierId,
            billNo,
            billDate,
            items, // Array of { productId, quantity, costPrice, sellingPrice, batchNumber, expiryDate, mrp }
            totalAmount,
            notes
        } = req.body;

        if (!supplierId || !items || items.length === 0) {
            return res.status(400).json({ message: 'Supplier and items are required' });
        }

        const transactionDate = billDate ? new Date(billDate) : new Date();

        // 1. Process Items (Stock & Batches)
        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) continue;

            // Update Product Cost/Selling Price if provided (Last Purchase Price logic)
            if (item.costPrice) product.costPrice = item.costPrice;
            if (item.sellingPrice) product.sellingPrice = item.sellingPrice;

            // Update Total Stock
            product.stock += parseFloat(item.quantity) || 0;

            // Handle Batch Logic
            if (product.isBatchTracked) {
                if (!item.batchNumber || !item.expiryDate) {
                    throw new Error(`Batch Number and Expiry Date required for ${product.name}`);
                }

                // Check if Batch exists (Product + BatchNo)
                let batch = await Batch.findOne({
                    product: item.productId,
                    batchNumber: item.batchNumber,
                    user: req.user.ownerId
                });

                if (batch) {
                    // Update existing batch
                    batch.quantity += parseFloat(item.quantity);
                    batch.mrp = item.mrp || batch.mrp;
                    batch.purchaseRate = item.costPrice || batch.purchaseRate;
                    await batch.save();
                } else {
                    // Create new batch
                    await Batch.create({
                        product: item.productId,
                        batchNumber: item.batchNumber,
                        expiryDate: item.expiryDate,
                        quantity: parseFloat(item.quantity),
                        mrp: item.mrp || 0,
                        purchaseRate: item.costPrice || 0,
                        user: req.user.ownerId
                    });
                }
            }

            await product.save();
        }

        // 2. Create Supplier Ledger Entry (Financials)
        const refNo = billNo || `PURCH-${Date.now().toString().slice(-8)}`;

        await SupplierLedgerEntry.create({
            supplier: supplierId,
            date: transactionDate,
            refType: 'Purchase',
            refId: null, // Could link to a Purchase Model if we had one (we rely on Ledger for now)
            refNo: refNo,
            description: notes || `Purchase of ${items.length} items`,
            debit: 0,
            credit: totalAmount,
            balance: 0, // Recalculated below
            user: req.user._id
        });

        // 3. Update Supplier Balance & Ledger
        await Supplier.findOneAndUpdate(
            { _id: supplierId },
            { $inc: { balance: totalAmount } }
        );

        await recalculateSupplierBalance(supplierId, req.user.ownerId);

        res.status(201).json({ message: 'Purchase recorded successfully' });

    } catch (error) {
        console.error('Create Purchase Error:', error);
        res.status(500).json({ message: error.message });
    }
};
