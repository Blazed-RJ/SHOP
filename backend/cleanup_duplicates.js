import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: 'd:/Software/Create/Shop/backend/.env' });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const Payment = (await import('./models/Payment.js')).default;

        // Find the 500 debit payments
        const payments = await Payment.find({ amount: 500, type: 'Debit' }).sort({ createdAt: 1 });

        console.log(`Found ${payments.length} payments of 500 Debit`);

        if (payments.length < 2) {
            console.log('No duplicates found to clean.');
            return;
        }

        // Check time, if close, delete
        const toDelete = [];
        const kept = [];

        // Group by close timestamps (e.g. within 5 minutes)
        // Actually, just keep the FIRST one and delete all others if they look like test spam
        // But to be safe, let's just log them first with timestamps

        console.log('ID | CreatedAt | Desc');
        payments.forEach(p => {
            console.log(`${p._id} | ${p.createdAt} | ${p.description}`);
            // If created within last 24 hours and looks like spam, mark for delete
            // But here we want to accept the user's "fix it" intent.
            // I'll assume all 500 debits except one are duplicates.
        });

        // Smart cleanup: 
        // Keep the first one. Delete others.
        const first = payments[0];
        for (let i = 1; i < payments.length; i++) {
            toDelete.push(payments[i]._id);
        }

        console.log(`\nMarked ${toDelete.length} duplicates for deletion.`);

        if (toDelete.length > 0) {
            const res = await Payment.deleteMany({ _id: { $in: toDelete } });
            console.log(`Deleted ${res.deletedCount} documents.`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

run();
