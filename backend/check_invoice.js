import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Invoice from './models/Invoice.js';

dotenv.config({ path: './.env' });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const inv = await Invoice.findOne().sort({ createdAt: -1 });
        console.log('Latest Invoice:', inv ? inv.invoiceNo : 'None');
        console.log('Date:', inv ? inv.createdAt : 'None');
        if (inv) {
            console.log('Paid Amount:', inv.paidAmount);
        }
    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
};

run();
