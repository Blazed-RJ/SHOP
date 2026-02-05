import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: 'd:/Software/Create/Shop/backend/.env' });

const verify = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('--- API Logic Verification ---');

        const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

        // 1. Check Search Logic directly in DB (simulating controller)
        const searchKeyword = 'Mystery';
        const searchRegex = { $regex: searchKeyword, $options: 'i' };
        const results = await Product.find({
            isActive: true,
            $or: [
                { name: searchRegex },
                { sku: searchRegex }
            ]
        });
        console.log(`Search for "${searchKeyword}" found ${results.length} products.`);
        results.forEach(p => console.log(` - ${p.name} (SKU: ${p.sku})`));

        // 2. Check Category Logic
        const category = '41512';
        const catResults = await Product.find({ category, isActive: true });
        console.log(`\nCategory "${category}" found ${catResults.length} products.`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verify();
