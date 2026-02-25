import { MongoClient, ObjectId } from 'mongodb';
const client = new MongoClient('mongodb://mongo:ywTpcBRnVIuDMUsmXbPlMQlPitqutIdL@shinkansen.proxy.rlwy.net:22494');
await client.connect();
const db = client.db('test');

const SAHU_ID = new ObjectId('699e4c389a9be875471a4ccd');
const SHARO_ID = new ObjectId('699dff41c8e63d0b41522995');

// Parse the ledger entries
// refType: 'Purchase' = Phone Bought (credit), 'Payment' = Payment (debit), 'Return' = Phone Back (debit)
const entries = [
    { date: '2024-05-25', refType: 'Purchase', refNo: 'No.04', description: 'Phone Bought', credit: 90200, debit: 0, balance: 90200 },
    { date: '2024-05-25', refType: 'Purchase', refNo: 'No.05', description: 'Phone Bought', credit: 109600, debit: 0, balance: 199800 },
    { date: '2024-05-25', refType: 'Purchase', refNo: 'No.06', description: 'Phone Bought', credit: 84670, debit: 0, balance: 284470 },
    { date: '2024-05-27', refType: 'Purchase', refNo: 'No.09', description: 'Phone Bought', credit: 224000, debit: 0, balance: 508470 },
    { date: '2024-05-27', refType: 'Purchase', refNo: 'No.10', description: 'Phone Bought', credit: 196000, debit: 0, balance: 704470 },
    { date: '2024-05-31', refType: 'Payment', refNo: 'Cheque No. 253762', description: 'Payment', credit: 0, debit: 50000, balance: 654470 },
    { date: '2024-06-12', refType: 'Payment', refNo: 'Cash', description: 'Payment', credit: 0, debit: 20000, balance: 634470 },
    { date: '2024-06-12', refType: 'Return', refNo: '', description: 'Phone Back', credit: 0, debit: 313400, balance: 321070 },
    { date: '2024-06-18', refType: 'Purchase', refNo: 'No.44', description: 'Phone Bought', credit: 8000, debit: 0, balance: 329070 },
    { date: '2024-06-21', refType: 'Payment', refNo: 'Cash', description: 'Payment', credit: 0, debit: 25000, balance: 304070 },
    { date: '2024-06-27', refType: 'Purchase', refNo: '', description: 'Phone Bought', credit: 8800, debit: 0, balance: 312870 },
    { date: '2024-06-28', refType: 'Payment', refNo: 'Cash', description: 'Payment', credit: 0, debit: 20000, balance: 292870 },
    { date: '2024-07-09', refType: 'Payment', refNo: 'Cash', description: 'Payment', credit: 0, debit: 15000, balance: 277870 },
    { date: '2024-07-12', refType: 'Purchase', refNo: '', description: 'Phone Bought', credit: 25000, debit: 0, balance: 302870 },
    { date: '2024-07-15', refType: 'Payment', refNo: 'Cash & Online', description: 'Payment', credit: 0, debit: 30000, balance: 272870 },
    { date: '2024-08-10', refType: 'Purchase', refNo: 'No.31', description: 'Phone Bought', credit: 20000, debit: 0, balance: 292870 },
    { date: '2024-08-19', refType: 'Payment', refNo: 'Cheque No. 426046', description: 'Payment', credit: 0, debit: 38000, balance: 254870 },
    { date: '2024-08-30', refType: 'Payment', refNo: 'Cheque No. 250302', description: 'Payment', credit: 0, debit: 50000, balance: 204870 },
    { date: '2024-08-30', refType: 'Purchase', refNo: '', description: 'Phone Bought', credit: 61700, debit: 0, balance: 266570 },
    { date: '2024-09-06', refType: 'Purchase', refNo: '', description: 'Phone Bought', credit: 13200, debit: 0, balance: 279770 },
    { date: '2024-09-19', refType: 'Return', refNo: '', description: 'Phone Back', credit: 0, debit: 44500, balance: 235270 },
    { date: '2024-09-19', refType: 'Payment', refNo: 'Cash', description: 'Payment', credit: 0, debit: 15000, balance: 220270 },
    { date: '2024-09-19', refType: 'Purchase', refNo: '', description: 'Phone Bought', credit: 30700, debit: 0, balance: 250970 },
    { date: '2024-09-24', refType: 'Purchase', refNo: '', description: 'Phone Bought', credit: 19000, debit: 0, balance: 269970 },
    { date: '2024-10-03', refType: 'Payment', refNo: 'Cheque No. 250304', description: 'Payment', credit: 0, debit: 30000, balance: 239970 },
    { date: '2025-04-04', refType: 'Payment', refNo: 'Online', description: 'Payment', credit: 0, debit: 50000, balance: 189970 },
    { date: '2026-02-04', refType: 'Payment', refNo: 'Online', description: 'Payment', credit: 0, debit: 30000, balance: 159970 },
];

// Build documents
const docs = entries.map(e => ({
    supplier: SAHU_ID,
    date: new Date(e.date),
    refType: e.refType,
    refId: null,
    refNo: e.refNo,
    description: e.description,
    debit: e.debit,
    credit: e.credit,
    balance: e.balance,
    billAttachment: '',
    user: SHARO_ID,
    createdAt: new Date(),
    updatedAt: new Date(),
    __v: 0
}));

// Clear existing entries for Sahu first to avoid duplicates
await db.collection('supplierledgerentries').deleteMany({ supplier: SAHU_ID });

// Insert all
const result = await db.collection('supplierledgerentries').insertMany(docs);
console.log(`✅ Inserted ${result.insertedCount} ledger entries for Sahu`);

// Update Sahu supplier balance to last entry balance
await db.collection('suppliers').updateOne(
    { _id: SAHU_ID },
    { $set: { balance: 159970, updatedAt: new Date() } }
);
console.log('✅ Updated Sahu balance to ₹1,59,970');

// Verify
const count = await db.collection('supplierledgerentries').countDocuments({ supplier: SAHU_ID });
console.log(`\n📋 Total Sahu ledger entries: ${count}`);
console.log('First entry:', await db.collection('supplierledgerentries').findOne({ supplier: SAHU_ID }, { projection: { date: 1, refType: 1, description: 1, credit: 1, debit: 1, balance: 1 } }));

await client.close();
console.log('\n🎉 Done!');
