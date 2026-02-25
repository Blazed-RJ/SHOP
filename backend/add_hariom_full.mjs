import { MongoClient, ObjectId } from 'mongodb';
const client = new MongoClient('mongodb://mongo:ywTpcBRnVIuDMUsmXbPlMQlPitqutIdL@shinkansen.proxy.rlwy.net:22494');
await client.connect();
const db = client.db('test');
const SHARO_ID = new ObjectId('699dff41c8e63d0b41522995');

// 1. Add Hari Om Enterprises supplier
const supp = await db.collection('suppliers').insertOne({
    name: 'Hari Om Enterprises', user: SHARO_ID, company: 'Hari Om Enterprises',
    type: 'Supplier', phone: '', email: null, address: '', gstNumber: null,
    balance: 20360, isActive: true, isDeleted: false, deletedAt: null,
    createdAt: new Date(), updatedAt: new Date(), __v: 0
});
const HARIOM_ID = supp.insertedId;
console.log('✅ Added Hari Om Enterprises:', HARIOM_ID.toString());

// 2. Insert 32 ledger entries
const entries = [
    { date: '2024-05-28', refType: 'Purchase', refNo: '6889', description: 'Phone Bought', credit: 37300, debit: 0, balance: 37300 },
    { date: '2024-05-30', refType: 'Payment', refNo: '415187512122', description: 'UPI Payment', credit: 0, debit: 10000, balance: 27300 },
    { date: '2024-07-10', refType: 'Payment', refNo: '419298536568', description: 'UPI Payment', credit: 0, debit: 2300, balance: 25000 },
    { date: '2024-09-06', refType: 'Payment', refNo: '461600011312', description: 'UPI Payment', credit: 0, debit: 10000, balance: 15000 },
    { date: '2024-09-30', refType: 'Purchase', refNo: '7208', description: 'Phone Bought', credit: 8400, debit: 0, balance: 23400 },
    { date: '2024-10-03', refType: 'Purchase', refNo: '7374', description: 'Phone Bought', credit: 5700, debit: 0, balance: 29100 },
    { date: '2024-10-03', refType: 'Payment', refNo: 'Online+Cash', description: 'Payment', credit: 0, debit: 9000, balance: 20100 },
    { date: '2024-10-18', refType: 'Purchase', refNo: '7390', description: 'Phone Bought', credit: 2500, debit: 0, balance: 22600 },
    { date: '2024-11-07', refType: 'Payment', refNo: 'Online 8000 + Cash 2000', description: 'Payment', credit: 0, debit: 10000, balance: 12600 },
    { date: '2024-11-09', refType: 'Purchase', refNo: '7290', description: 'Phone Bought', credit: 8200, debit: 0, balance: 20800 },
    { date: '2025-01-09', refType: 'Payment', refNo: 'Cash', description: 'Payment', credit: 0, debit: 5000, balance: 15800 },
    { date: '2025-04-08', refType: 'Purchase', refNo: '7667', description: 'Phone Bought', credit: 11300, debit: 0, balance: 27100 },
    { date: '2025-04-08', refType: 'Payment', refNo: 'Online 3000 + Cash 3000', description: 'Payment', credit: 0, debit: 6000, balance: 21100 },
    { date: '2025-05-22', refType: 'Payment', refNo: 'Online 5000', description: 'Payment', credit: 0, debit: 5000, balance: 16100 },
    { date: '2025-06-12', refType: 'Purchase', refNo: '7856', description: 'Phone Bought', credit: 5400, debit: 0, balance: 21500 },
    { date: '2025-06-12', refType: 'Purchase', refNo: '7857', description: 'Phone Bought', credit: 3163, debit: 0, balance: 24663 },
    { date: '2025-06-12', refType: 'Payment', refNo: 'Online', description: 'Payment', credit: 0, debit: 3163, balance: 21500 },
    { date: '2025-06-17', refType: 'Purchase', refNo: '7863', description: 'Phone Bought', credit: 6500, debit: 0, balance: 28000 },
    { date: '2025-06-17', refType: 'Payment', refNo: 'Online', description: 'Payment', credit: 0, debit: 6500, balance: 21500 },
    { date: '2025-07-30', refType: 'Purchase', refNo: '8046', description: 'Phone Bought', credit: 3950, debit: 0, balance: 25450 },
    { date: '2025-07-30', refType: 'Payment', refNo: 'Online', description: 'Payment', credit: 0, debit: 10000, balance: 15450 },
    { date: '2025-08-14', refType: 'Purchase', refNo: '8064', description: 'Phone Bought', credit: 8300, debit: 0, balance: 23750 },
    { date: '2025-08-14', refType: 'Payment', refNo: 'Cash', description: 'Payment', credit: 0, debit: 4000, balance: 19750 },
    { date: '2025-09-03', refType: 'Purchase', refNo: '8064', description: 'Phone Bought', credit: 3850, debit: 0, balance: 23600 },
    { date: '2025-09-04', refType: 'Payment', refNo: 'Cash + Online', description: 'Payment', credit: 0, debit: 7000, balance: 16600 },
    { date: '2025-09-06', refType: 'Purchase', refNo: '8097', description: 'Phone Bought', credit: 2150, debit: 0, balance: 18750 },
    { date: '2025-10-13', refType: 'Purchase', refNo: '8397', description: 'Phone Bought', credit: 5850, debit: 0, balance: 24600 },
    { date: '2025-10-13', refType: 'Payment', refNo: 'Cash', description: 'Payment', credit: 0, debit: 5000, balance: 19600 },
    { date: '2025-11-12', refType: 'Purchase', refNo: '8469', description: 'Phone Bought', credit: 3360, debit: 0, balance: 22960 },
    { date: '2025-11-15', refType: 'Purchase', refNo: '8473', description: 'Combo Box Bought', credit: 12400, debit: 0, balance: 35360 },
    { date: '2025-11-15', refType: 'Payment', refNo: 'Online', description: 'Payment', credit: 0, debit: 10000, balance: 25360 },
    { date: '2026-02-04', refType: 'Payment', refNo: 'Online', description: 'Payment', credit: 0, debit: 5000, balance: 20360 },
];

const docs = entries.map(e => ({
    supplier: HARIOM_ID,
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

const result = await db.collection('supplierledgerentries').insertMany(docs);
console.log(`✅ Inserted ${result.insertedCount} ledger entries for Hari Om Enterprises`);
console.log('✅ Final balance: ₹20,360');

await client.close();
console.log('🎉 Done!');
