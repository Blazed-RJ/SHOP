import { MongoClient, ObjectId } from 'mongodb';
const client = new MongoClient('mongodb://mongo:ywTpcBRnVIuDMUsmXbPlMQlPitqutIdL@shinkansen.proxy.rlwy.net:22494');
await client.connect();
const db = client.db('test');
const sharoId = new ObjectId('699dff41c8e63d0b41522995');

// Check suppliers
const suppliers = await db.collection('suppliers').find({ user: sharoId }).toArray();
console.log('Suppliers for sharogiadigital:');
suppliers.forEach(s => console.log(JSON.stringify({ name: s.name, isActive: s.isActive, isDeleted: s.isDeleted })));

// Fix: set isActive: true on all
const fix = await db.collection('suppliers').updateMany(
    { user: sharoId },
    { $set: { isActive: true, isDeleted: false } }
);
console.log('Fixed isActive:', fix.modifiedCount);

// Also fix products and customers
const prodFix = await db.collection('products').updateMany(
    { user: sharoId, isActive: { $ne: true } },
    { $set: { isActive: true } }
);
console.log('Fixed products isActive:', prodFix.modifiedCount);

const custFix = await db.collection('customers').updateMany(
    { user: sharoId, isActive: { $ne: true } },
    { $set: { isActive: true } }
);
console.log('Fixed customers isActive:', custFix.modifiedCount);

await client.close();
console.log('Done!');
