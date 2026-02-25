import mongoose from 'mongoose';

const URI = 'mongodb://mongo:ywTpcBRnVIuDMUsmXbPlMQlPitqutIdL@shinkansen.proxy.rlwy.net:22494/test?authSource=admin';

mongoose.connect(URI)
    .then(async () => {
        const db = mongoose.connection.db;
        console.log("Connected to Railway Proxy DB");

        const user = await db.collection('users').findOne({ email: 'sharogiadigital@gmail.com' });
        if (!user) {
            console.log("User sharogiadigital@gmail.com not found!");
            process.exit(1);
        }
        console.log('\n--- TARGET USER ---');
        console.log('_id:', user._id.toString());
        console.log('ownerId:', user.ownerId ? user.ownerId.toString() : 'null');

        const myPayments = await db.collection('payments').find({
            $or: [
                { user: user._id },
                { user: user.ownerId },
                { user: user._id?.toString() },
                { user: user.ownerId?.toString() }
            ]
        }).toArray();

        console.log('\n--- PAYMENTS MATCHING USER ---');
        console.log('Total Payments:', myPayments.length);

        if (myPayments.length > 0) {
            console.log('\nFirst 5:');
            myPayments.slice(0, 5).forEach(p => {
                console.log(`ID: ${p._id} | Method: ${p.method} | Type: ${p.type} | Amt: ${p.amount}`);
                console.log(`    user: ${p.user} (type: ${typeof p.user})`);
            });

            let cashDebit = 0, cashCredit = 0;
            myPayments.forEach(p => {
                if (p.method === 'Cash') {
                    if (p.type === 'Debit') cashDebit += p.amount;
                    if (p.type === 'Credit') cashCredit += p.amount;
                }
            });
            console.log(`Total Cash Debit: ${cashDebit} | Total Cash Credit: ${cashCredit} | Net: ${cashDebit - cashCredit}`);
        }

        // Let's also check if there are ANY payments at all
        const anyPayment = await db.collection('payments').find({}).limit(1).toArray();
        console.log('\nAny payment exist in DB?', anyPayment.length > 0 ? "YES" : "NO");

        process.exit();
    }).catch(err => {
        console.error("Connection failed:", err.message);
        process.exit();
    });
