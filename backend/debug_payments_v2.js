import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env
dotenv.config({ path: 'd:/Software/Create/Shop/backend/.env' });

const run = async () => {
    try {
        console.log('Connecting to:', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);

        // Import model
        const Payment = (await import('./models/Payment.js')).default;

        // Find ALL payments
        const payments = await Payment.find()
            .populate('supplier')
            .sort({ createdAt: -1 });

        console.log(`\nFound ${payments.length} total payments\n`);
        console.log('DATE       | AMOUNT    | TYPE   | PARTY/DESC                                | ID');
        console.log('-'.repeat(85));

        let totalDebit = 0;
        let totalCredit = 0;

        payments.forEach(p => {
            const date = p.date ? new Date(p.date).toISOString().split('T')[0] : 'No Date';
            const party = p.supplier ? p.supplier.name : (p.description || 'No Description');
            const type = p.type || 'Debit'; // Default to Debit if undefined

            console.log(`${date} | ${p.amount.toString().padEnd(9)} | ${type.padEnd(6)} | ${party.padEnd(41)} | ${p._id}`);

            if (type === 'Debit') totalDebit += p.amount;
            if (type === 'Credit') totalCredit += p.amount;
        });

        console.log('-'.repeat(85));
        console.log(`Total Debit (Out): ${totalDebit}`);
        console.log(`Total Credit (In):  ${totalCredit}`);
        console.log(`Net Balance:        ${totalCredit - totalDebit}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

run();
