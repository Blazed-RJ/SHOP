import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const products = await Product.find({ isActive: true });
        console.log('Active Products count:', products.length);

        products.forEach(p => {
            console.log(`- ${p.name} (Cat: ${p.category}, Stock: ${p.stock})`);
        });

    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}).catch(console.error);
