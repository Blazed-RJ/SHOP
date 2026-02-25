import mongoose from 'mongoose';

mongoose.connect('mongodb://localhost:27017/mobile_pos_db')
    .then(async () => {
        const db = mongoose.connection.db;
        const user = await db.collection('users').findOne({ email: 'test@example.com' })
            || await db.collection('users').findOne({});

        console.log('User:', user.email, '| ownerId:', user.ownerId);

        const count = await db.collection('payments').countDocuments({ user: user.ownerId || user._id });
        console.log('Payments Count for user:', count);

        if (count > 0) {
            const aggs = await db.collection('payments').aggregate([
                { $match: { user: user.ownerId || user._id, method: 'Cash' } },
                {
                    $group: {
                        _id: null,
                        totalDebit: { $sum: { $cond: [{ $eq: ['$type', 'Debit'] }, '$amount', 0] } },
                        totalCredit: { $sum: { $cond: [{ $eq: ['$type', 'Credit'] }, '$amount', 0] } }
                    }
                }
            ]).toArray();
            console.log('Cash Aggregation result:', aggs);
        }
        process.exit();
    });
