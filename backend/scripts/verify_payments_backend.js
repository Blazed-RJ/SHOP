
import mongoose from 'mongoose';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from backend root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('MongoDB Connection Failed:', error);
        process.exit(1);
    }
};

const runVerification = async () => {
    await connectDB();

    try {
        // 1. Find a test user (owner)
        // Hardcode specific ID if known, or find first owner
        const user = await User.findOne({ role: 'Admin' });
        if (!user) {
            console.error('Test user not found');
            return;
        }

        console.log(`Using User: ${user.email} (ID: ${user._id}, OwnerID: ${user.ownerId})`);

        // Ensure ownerId is set (mimic auth middleware logic)
        const ownerId = user.ownerId || user._id;

        // 2. Create a test payment (Add Money)
        const amount = 500;
        const payment = await Payment.create({
            user: ownerId,
            recordedBy: user._id,
            type: 'Debit',
            category: 'Receipt',
            amount: amount,
            method: 'Cash', // Case sensitive check
            notes: 'Verification Script Test',
            date: new Date()
        });
        console.log('Created Payment:', payment._id);

        // 3. Run Aggregation for Cash In Hand (mimic reportController)
        const cashPayments = await Payment.aggregate([
            { $match: { user: ownerId, method: 'Cash' } },
            {
                $group: {
                    _id: null,
                    totalDebit: {
                        $sum: { $cond: [{ $eq: ["$type", "Debit"] }, "$amount", 0] }
                    },
                    totalCredit: {
                        $sum: { $cond: [{ $eq: ["$type", "Credit"] }, "$amount", 0] }
                    }
                }
            }
        ]);

        console.log('Aggregation Result (Method=Cash):', JSON.stringify(cashPayments, null, 2));

        const cashInHand = cashPayments.length > 0 ? (cashPayments[0].totalDebit - cashPayments[0].totalCredit) : 0;
        console.log(`Calculated Cash In Hand: ${cashInHand}`);

        // 4. Verify NON-Cash (Proving differentiation)
        const paymentBank = await Payment.create({
            user: ownerId,
            recordedBy: user._id,
            type: 'Debit',
            category: 'Receipt',
            amount: 1000,
            method: 'Bank Transfer',
            notes: 'Verification Script Test Bank',
            date: new Date()
        });

        const bankPayments = await Payment.aggregate([
            { $match: { user: ownerId, method: { $ne: 'Cash' } } },
            {
                $group: {
                    _id: null,
                    totalDebit: { $sum: { $cond: [{ $eq: ["$type", "Debit"] }, "$amount", 0] } },
                    totalCredit: { $sum: { $cond: [{ $eq: ["$type", "Credit"] }, "$amount", 0] } }
                }
            }
        ]);
        console.log('Aggregation Result (Method!=Cash):', JSON.stringify(bankPayments, null, 2));


        // Cleanup
        await Payment.deleteMany({ notes: { $regex: 'Verification Script Test' } });
        console.log('Cleaned up test payments');

    } catch (error) {
        console.error('Verification Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

runVerification();
