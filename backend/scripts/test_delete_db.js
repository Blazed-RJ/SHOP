
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const testDelete = async () => {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGODB_URI);
        const ownerId = '64e622f46258907f1418b765';

        // 1. Create dummy
        console.log('Creating dummy product...');
        const product = await Product.create({
            name: 'Test Delete Product ' + Date.now(),
            category: 'Testing',
            costPrice: 100,
            sellingPrice: 150,
            gstPercent: 18,
            stock: 10,
            user: ownerId,
            isActive: true,
            sku: 'TEST-DEL-' + Date.now()
        });
        console.log('Created:', product._id, product.name);

        // 2. Find and delete (soft)
        console.log('Attempting soft delete...');
        const p = await Product.findOne({ _id: product._id, user: ownerId });
        if (!p) {
            console.error('Product not found for delete! Owner ID mismatch?');
            console.log('Expected Owner:', ownerId);
            // Check actual product owner
            const actual = await Product.findById(product._id);
            console.log('Actual Owner:', actual ? actual.user : 'null');
            throw new Error('Product not found for delete');
        }

        p.isActive = false;
        await p.save();
        console.log('Deleted (soft):', p._id);

        // 3. Verify
        const check = await Product.findById(product._id);
        console.log('Is Active:', check.isActive);

        if (check.isActive === false) {
            console.log('SUCCESS: Product soft deleted.');
        } else {
            console.log('FAILURE: Product is still active.');
        }

        // Clean up (hard delete)
        await Product.deleteOne({ _id: product._id });
        console.log('Cleaned up test data.');

        process.exit(0);
    } catch (e) {
        console.error('ERROR:', e);
        process.exit(1);
    }
};

testDelete();
