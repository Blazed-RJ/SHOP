import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Payment from '../models/Payment.js';
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
            const payments = await Payment.find({}).sort({ createdAt: -1 }).limit(10);
            console.log(`Found ${payments.length} recent payments.`);

            if (payments.length > 0) {
                console.log(JSON.stringify(payments, null, 2));
            } else {
                console.log('No payments found in the database.');
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
