import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: 'd:/Software/Create/Shop/backend/.env' });

const run = async () => {
    try {
        console.log('Connecting...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected!');

        const collection = mongoose.connection.db.collection('payments');
        const payments = await collection.find({}).sort({ createdAt: -1 }).toArray();

        const fs = await import('fs');
        let output = '';
        output += `\nFound ${payments.length} documents\n\n`;
        output += 'DATE       | AMOUNT    | TYPE   | DESC                                      | ID\n';
        output += '-'.repeat(85) + '\n';

        payments.forEach(p => {
            const date = p.date ? new Date(p.date).toISOString().split('T')[0] : 'No Date';
            output += `${date} | ${p.amount.toString().padEnd(9)} | ${p.type?.padEnd(6)} | ${(p.description || '').padEnd(41)} | ${p._id}\n`;
        });

        fs.writeFileSync('payments_dump.txt', output);
        console.log('Written to payments_dump.txt');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

run();
