import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../frontend/.env') }); // Try frontend env first
if (!process.env.MONGODB_URI) {
    dotenv.config({ path: path.join(__dirname, '../.env') }); // Fallback to backend env
}

console.log('Connecting to MongoDB...', process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');

        try {
            // 1. Fetch all products to see what's there
            const allProducts = await Product.find({});
            console.log(`Total Products in DB: ${allProducts.length}`);

            if (allProducts.length > 0) {
                console.log('Sample Product:', JSON.stringify(allProducts[0], null, 2));
            }

            // 2. Run the aggregation key
            const ownerId = allProducts.length > 0 ? allProducts[0].user : null;

            if (ownerId) {
                console.log(`Running aggregation for user: ${ownerId}`);
                const productValueAgg = await Product.aggregate([
                    { $match: { user: ownerId } },
                    {
                        $group: {
                            _id: null,
                            totalValue: { $sum: { $multiply: ["$costPrice", "$stock"] } },
                            count: { $sum: 1 }
                        }
                    }
                ]);
                console.log('Aggregation Result:', JSON.stringify(productValueAgg, null, 2));
            } else {
                console.log('No user found to test aggregation.');
            }

        } catch (error) {
            console.error('Error:', error);
        } finally {
            mongoose.connection.close();
        }
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
    });
