import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Payment from '../models/Payment.js';
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

const TARGET_USER_EMAIL = 'final@test.com'; // The main admin user

console.log('Connecting to MongoDB...', process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');

        try {
            // 1. Find the target user
            const targetUser = await User.findOne({ email: TARGET_USER_EMAIL });
            if (!targetUser) {
                console.error(`Target user ${TARGET_USER_EMAIL} not found!`);
                process.exit(1);
            }
            console.log(`Target User: ${targetUser.name} (${targetUser._id})`);

            // 2. Find payments with the ghost ID (or just all payments for now to be safe, but let's check the ghost ID first)
            // The ghost ID observed in logs: 64e622f46258907f1418b765
            const ghostId = new mongoose.Types.ObjectId('64e622f46258907f1418b765');

            const ghostPayments = await Payment.countDocuments({ user: ghostId });
            console.log(`Found ${ghostPayments} payments belonging to ghost user ${ghostId}.`);

            if (ghostPayments > 0) {
                const result = await Payment.updateMany(
                    { user: ghostId },
                    { $set: { user: targetUser._id } }
                );
                console.log(`Updated ${result.modifiedCount} payments to user ${targetUser._id}.`);
            } else {
                console.log('No ghost payments found. Checking for ANY payments...');
                const allPaymentsCount = await Payment.countDocuments({});
                console.log(`Total payments in DB: ${allPaymentsCount}`);
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
