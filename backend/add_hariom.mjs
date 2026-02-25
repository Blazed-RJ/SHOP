import { MongoClient, ObjectId } from 'mongodb';
const client = new MongoClient('mongodb://mongo:ywTpcBRnVIuDMUsmXbPlMQlPitqutIdL@shinkansen.proxy.rlwy.net:22494');
await client.connect();
const db = client.db('test');
const SHARO_ID = new ObjectId('699dff41c8e63d0b41522995');

const r = await db.collection('suppliers').insertOne({
    name: 'Hari Om Enterprises', user: SHARO_ID, company: 'Hari Om Enterprises',
    type: 'Supplier', phone: '', email: null, address: '', gstNumber: null,
    balance: 0, isActive: true, isDeleted: false, deletedAt: null,
    createdAt: new Date(), updatedAt: new Date(), __v: 0
});
console.log('✅ Added Hari Om Enterprises:', r.insertedId.toString());

const all = await db.collection('suppliers').find({ user: SHARO_ID, isActive: true }).sort({ name: 1 }).toArray();
console.log('All suppliers:', all.map(s => s.name).join(', '));
await client.close();
