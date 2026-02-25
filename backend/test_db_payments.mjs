import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://rajat8740:Rajat%408740@blaze.i2i7d.mongodb.net/shop_management?retryWrites=true&w=majority&appName=BLAZE';

mongoose.connect(MONGODB_URI)
    .then(async () => {
        const db = mongoose.connection.db;

        const user = await db.collection('users').findOne({ email: 'sharogiadigital@gmail.com' });
        if (!user) {
            console.log("USER sharogiadigital@gmail.com NOT FOUND in this DB.");
            process.exit();
        }

        console.log('\n--- ADMIN USER ---');
        console.log('_id:', user._id.toString());
        console.log('ownerId:', user.ownerId ? user.ownerId.toString() : 'null');

        const myPayments = await db.collection('payments').find({
            $or: [
                { user: user._id },
                { user: user.ownerId },
                { user: user._id.toString() } // maybe string instead of ObjectId?
            ]
        }).toArray();

        console.log(`\nFound ${myPayments.length} payments linked to admin user.`);

        let cashIn = 0, cashOut = 0;
        let bankIn = 0, bankOut = 0;
        const bankMethods = ['UPI', 'Card', 'Cheque', 'Bank Transfer', 'Online'];

        myPayments.forEach(p => {
            if (p.method === 'Cash') {
                if (p.type === 'Debit') cashIn += p.amount;
                if (p.type === 'Credit') cashOut += p.amount;
            } else if (bankMethods.includes(p.method)) {
                if (p.type === 'Debit') bankIn += p.amount;
                if (p.type === 'Credit') bankOut += p.amount;
            }
        });
        console.log(`\nCash In: ${cashIn} | Cash Out: ${cashOut} | Net Cash: ${cashIn - cashOut}`);
        console.log(`Bank In: ${bankIn} | Bank Out: ${bankOut} | Net Bank: ${bankIn - bankOut}`);

        if (myPayments.length > 0) {
            console.log('\n--- SAMPLE PAYMENTS ---');
            myPayments.slice(0, 5).forEach(p => {
                console.log(`ID: ${p._id} | Method: ${p.method} | Type: ${p.type} | Amt: ${p.amount}`);
                console.log(`    user: ${p.user} (type: ${typeof p.user})`);
            });
        }

        process.exit();
    });
