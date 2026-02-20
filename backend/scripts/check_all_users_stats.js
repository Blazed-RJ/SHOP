import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Payment from '../models/Payment.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../frontend/.env') });
if (!process.env.MONGODB_URI) {
    dotenv.config({ path: path.join(__dirname, '../.env') });
}

console.log('Connecting to MongoDB...', process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');

        try {
            const users = await User.find({}, 'name email role');
            console.log(`Found ${users.length} users.`);

            for (const user of users) {
                const ownerId = user._id; // Assuming single owner for now or complex logic if Staff

                // 1. Calculate Cash In Hand
                const cashPayments = await Payment.aggregate([
                    { $match: { user: ownerId, method: 'Cash' } },
                    {
                        $group: {
                            _id: null,
                            totalDebit: { $sum: { $cond: [{ $eq: ["$type", "Debit"] }, "$amount", 0] } },
                            totalCredit: { $sum: { $cond: [{ $eq: ["$type", "Credit"] }, "$amount", 0] } }
                        }
                    }
                ]);
                const cashInHand = cashPayments.length > 0 ? (cashPayments[0].totalDebit - cashPayments[0].totalCredit) : 0;

                // 2. Product Value
                const productValueAgg = await Product.aggregate([
                    { $match: { user: ownerId, isActive: true } },
                    {
                        $group: {
                            _id: null,
                            totalValue: { $sum: { $multiply: ["$costPrice", "$stock"] } }
                        }
                    }
                ]);
                const productValue = productValueAgg.length > 0 ? productValueAgg[0].totalValue : 0;

                console.log(`User: ${user.name} (${user.email}) [${user.role}]`);
                console.log(`  > ID: ${user._id}`);
                console.log(`  > Cash In Hand: ${cashInHand}`);
                console.log(`  > Product Value: ${productValue}`);
                console.log('-----------------------------------');
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
