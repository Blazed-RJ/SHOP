import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './backend/models/Product.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        console.log('Connected to MongoDB');
        const updateResult = await Product.updateMany({ isActive: true }, { $set: { isActive: false } });
        console.log(`Successfully soft-deleted (wiped) ${updateResult.modifiedCount} active products.`);
    } catch (e) {
        console.error('Error wiping products:', e);
    }
    process.exit(0);
}).catch(console.error);
