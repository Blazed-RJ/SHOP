
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../backend/models/Product.js';

dotenv.config({ path: 'backend/.env' });

const checkProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const total = await Product.countDocuments();
        console.log(`Total Products in DB: ${total}`);

        const products = await Product.find({});
        console.log('--- Product Sample ---');
        products.slice(0, 5).forEach(p => {
            console.log(`ID: ${p._id}, Name: ${p.name}, Owner: ${p.user}, Active: ${p.isActive}`);
        });

        // Group by Owner
        const byOwner = {};
        products.forEach(p => {
            const oid = p.user ? p.user.toString() : 'null';
            if (!byOwner[oid]) byOwner[oid] = 0;
            byOwner[oid]++;
        });
        console.log('--- Counts by Owner ---');
        console.log(byOwner);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

checkProducts();
