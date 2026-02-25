import { MongoClient, ObjectId } from 'mongodb';
const client = new MongoClient('mongodb://mongo:ywTpcBRnVIuDMUsmXbPlMQlPitqutIdL@shinkansen.proxy.rlwy.net:22494');
await client.connect();
const db = client.db('test');

// sharogiadigital's CURRENT userId (from Google sign-in)
const SHARO_CURRENT_ID = new ObjectId('699dff41c8e63d0b41522995');

// These are the old userIds whose data belongs to sharogiadigital
// 64e622... = 430 products (main account), 697e4d... = testuser (16 products)
// We'll reassign the main 430 to sharogiadigital
const OLD_SHARO_ID = new ObjectId('64e622f46258907f1418b765');

console.log('Reassigning products from old userId to sharogiadigital...');

// Reassign products
const prodResult = await db.collection('products').updateMany(
    { user: OLD_SHARO_ID },
    { $set: { user: SHARO_CURRENT_ID } }
);
console.log(`✅ Products reassigned: ${prodResult.modifiedCount}`);

// Reassign categories
const catResult = await db.collection('categories').updateMany(
    { user: OLD_SHARO_ID },
    { $set: { user: SHARO_CURRENT_ID } }
);
console.log(`✅ Categories reassigned: ${catResult.modifiedCount}`);

// Reassign invoices
const invResult = await db.collection('invoices').updateMany(
    { $or: [{ user: OLD_SHARO_ID }, { createdBy: OLD_SHARO_ID }] },
    { $set: { user: SHARO_CURRENT_ID, createdBy: SHARO_CURRENT_ID } }
);
console.log(`✅ Invoices reassigned: ${invResult.modifiedCount}`);

// Reassign payments
const payResult = await db.collection('payments').updateMany(
    { user: OLD_SHARO_ID },
    { $set: { user: SHARO_CURRENT_ID } }
);
console.log(`✅ Payments reassigned: ${payResult.modifiedCount}`);

// Reassign customers
const custResult = await db.collection('customers').updateMany(
    { user: OLD_SHARO_ID },
    { $set: { user: SHARO_CURRENT_ID } }
);
console.log(`✅ Customers reassigned: ${custResult.modifiedCount}`);

// Reassign suppliers
const supResult = await db.collection('suppliers').updateMany(
    { user: OLD_SHARO_ID },
    { $set: { user: SHARO_CURRENT_ID } }
);
console.log(`✅ Suppliers reassigned: ${supResult.modifiedCount}`);

// Verify final count
const sharoProducts = await db.collection('products').countDocuments({ user: SHARO_CURRENT_ID });
const sharoCategories = await db.collection('categories').countDocuments({ user: SHARO_CURRENT_ID });
const sharoInvoices = await db.collection('invoices').countDocuments({ user: SHARO_CURRENT_ID });
const sharoCustomers = await db.collection('customers').countDocuments({ user: SHARO_CURRENT_ID });

console.log('\n=== sharogiadigital now has ===');
console.log(`  Products: ${sharoProducts}`);
console.log(`  Categories: ${sharoCategories}`);
console.log(`  Invoices: ${sharoInvoices}`);
console.log(`  Customers: ${sharoCustomers}`);

await client.close();
console.log('\n🎉 Done!');
