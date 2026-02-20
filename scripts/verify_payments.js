
import mongoose from 'mongoose';
import Payment from '../backend/models/Payment.js';
import User from '../backend/models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
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
        const user = await User.findOne({ email: 'test@example.com' }); // Adjust email if needed
        if (!user) {
            console.error('Test user not found');
            // List users
            const users = await User.find().limit(5);
            console.log('Available users:', users.map(u => u.email));
            return;
        }

        console.log(`Using User: ${user.email} (ID: ${user._id}, OwnerID: ${user.ownerId})`);

        // 2. Create a test payment (Add Money)
        const amount = 500;
        const payment = await Payment.create({
            user: user.ownerId,
            recordedBy: user._id,
            type: 'Debit',
            category: 'Receipt',
            amount: amount,
            method: 'Cash',
            notes: 'Verification Script Test',
            date: new Date()
        });
        console.log('Created Payment:', payment._id);

        // 3. Run Aggregation for Cash In Hand
        const cashPayments = await Payment.aggregate([
            { $match: { user: user.ownerId, method: 'Cash' } },
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

        console.log('Aggregation Result:', JSON.stringify(cashPayments, null, 2));

        const cashInHand = cashPayments.length > 0 ? (cashPayments[0].totalDebit - cashPayments[0].totalCredit) : 0;
        console.log(`Calculated Cash In Hand: ${cashInHand}`);

        // Cleanup
        await Payment.deleteOne({ _id: payment._id });
        console.log('Cleaned up test payment');

    } catch (error) {
        console.error('Verification Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

runVerification();
