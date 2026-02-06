import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import moment from 'moment-timezone';

import Invoice from './models/Invoice.js';
import Payment from './models/Payment.js';
import User from './models/User.js';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
        process.exit(1);
    }
};

const verifyDashboardLogic = async () => {
    await connectDB();

    try {
        // 1. Get a Test User
        const user = await User.findOne({});
        if (!user) {
            console.error('No user found to test with.');
            process.exit(1);
        }
        const ownerId = user._id; // Assuming single user/owner model for simplicity or taking the first one
        console.log(`Running test for User ID: ${ownerId}`);

        // 2. Define Time Ranges (Exact logic from Controller)
        // Using "Asia/Kolkata" as per controller
        const todayStart = moment().tz("Asia/Kolkata").startOf('day').toDate();
        const todayEnd = moment().tz("Asia/Kolkata").endOf('day').toDate();
        const yesterdayStart = moment().tz("Asia/Kolkata").subtract(1, 'days').startOf('day').toDate();
        const yesterdayEnd = moment().tz("Asia/Kolkata").subtract(1, 'days').endOf('day').toDate();

        console.log('Time Ranges:');
        console.log(`Today: ${todayStart.toISOString()} - ${todayEnd.toISOString()}`);
        console.log(`Yesterday: ${yesterdayStart.toISOString()} - ${yesterdayEnd.toISOString()}`);

        // 3. Create Test Data
        const testIdentifier = `TEST_VERIFY_${Date.now()}`;

        // Invoice Today
        const invToday = await Invoice.create({
            user: ownerId,
            invoiceNo: `${testIdentifier}_TODAY`,
            customerName: 'Test Customer Today',
            grandTotal: 1000,
            status: 'Paid',
            invoiceDate: new Date(), // Now
            totalTax: 0, subTotal: 1000, items: []
        });

        // Invoice Yesterday (Created Today but Dated Yesterday)
        const invYesterday = await Invoice.create({
            user: ownerId,
            invoiceNo: `${testIdentifier}_YESTERDAY`,
            customerName: 'Test Customer Yesterday',
            grandTotal: 500,
            status: 'Paid',
            invoiceDate: moment().tz("Asia/Kolkata").subtract(1, 'days').toDate(), // Yesterday
            createdAt: new Date(), // Created NOW
            totalTax: 0, subTotal: 500, items: []
        });

        // Payment Today
        const payToday = await Payment.create({
            user: ownerId,
            customer: null, // Ad-hoc
            amount: 100,
            type: 'Debit', // In
            method: 'Cash',
            date: new Date(),
            createdAt: new Date()
        });

        // Payment Yesterday (Created Today but Dated Yesterday)
        const payYesterday = await Payment.create({
            user: ownerId,
            customer: null,
            amount: 50,
            type: 'Debit', // In
            method: 'Cash',
            date: moment().tz("Asia/Kolkata").subtract(1, 'days').toDate(),
            createdAt: new Date()
        });

        console.log('Test Data Created.');

        // 4. Run Aggregation (The "Fix" Logic)

        // TODAY'S SALES (Should be 1000 + existing)
        // We will just query specifically for our test invoices to be sure

        const pipelineToday = [
            {
                $match: {
                    user: ownerId,
                    invoiceNo: { $regex: testIdentifier }, // Filter only our test data
                    invoiceDate: { $gte: todayStart, $lte: todayEnd }
                }
            },
            { $group: { _id: null, total: { $sum: '$grandTotal' } } }
        ];

        const pipelineYesterday = [
            {
                $match: {
                    user: ownerId,
                    invoiceNo: { $regex: testIdentifier },
                    invoiceDate: { $gte: yesterdayStart, $lte: yesterdayEnd }
                }
            },
            { $group: { _id: null, total: { $sum: '$grandTotal' } } }
        ];

        const resToday = await Invoice.aggregate(pipelineToday);
        const resYesterday = await Invoice.aggregate(pipelineYesterday);

        console.log('\n--- VERIFICATION RESULTS ---');
        console.log(`Expected Today Sales (Test Data): 1000`);
        console.log(`Actual Today Sales (Test Data): ${resToday[0]?.total || 0}`);

        console.log(`Expected Yesterday Sales (Test Data): 500`);
        console.log(`Actual Yesterday Sales (Test Data): ${resYesterday[0]?.total || 0}`);

        if ((resToday[0]?.total || 0) === 1000 && (resYesterday[0]?.total || 0) === 500) {
            console.log('✅ SUCCESS: Date filtering is working correctly based on invoiceDate.');
        } else {
            console.log('❌ FAILED: Date filtering is incorrect.');
        }

        // Cleanup
        await Invoice.deleteMany({ invoiceNo: { $regex: testIdentifier } });
        await Payment.deleteOne({ _id: payToday._id });
        await Payment.deleteOne({ _id: payYesterday._id });
        console.log('\nCleanup done.');

        process.exit(0);

    } catch (error) {
        console.error('Test Failed:', error);
        process.exit(1);
    }
};

verifyDashboardLogic();
