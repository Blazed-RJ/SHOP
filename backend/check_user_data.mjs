import { MongoClient } from 'mongodb';

const RAILWAY_URI = 'mongodb://mongo:ywTpcBRnVIuDMUsmXbPlMQlPitqutIdL@shinkansen.proxy.rlwy.net:22494';
const client = new MongoClient(RAILWAY_URI, { serverSelectionTimeoutMS: 15000 });
await client.connect();

const testDb = client.db('test');

// Check sharogiadigital user
const user = await testDb.collection('users').findOne({ username: 'sharogiadigital' });
console.log('sharogiadigital user:', JSON.stringify({
    _id: user?._id,
    username: user?.username,
    email: user?.email,
    role: user?.role,
    createdAt: user?.createdAt,
}, null, 2));

// Check if invoices have userId/createdBy fields
const sampleInvoice = await testDb.collection('invoices').findOne({});
console.log('\nSample invoice fields:', sampleInvoice ? Object.keys(sampleInvoice) : 'NO INVOICES');
if (sampleInvoice?.createdBy) console.log('  createdBy:', sampleInvoice.createdBy);
if (sampleInvoice?.userId) console.log('  userId:', sampleInvoice.userId);

// Check if products have userId field
const sampleProduct = await testDb.collection('products').findOne({});
console.log('\nSample product fields:', sampleProduct ? Object.keys(sampleProduct) : 'NO PRODUCTS');
if (sampleProduct?.createdBy) console.log('  createdBy:', sampleProduct.createdBy);
if (sampleProduct?.userId) console.log('  userId:', sampleProduct.userId);

// Check settings - who are they for?
const settings = await testDb.collection('settings').find({}).toArray();
console.log(`\nSettings docs (${settings.length} total):`);
settings.forEach(s => {
    console.log(`  - userId: ${s.userId || s.user || 'NONE'}, keys: ${Object.keys(s).filter(k => k !== '_id').join(', ')}`);
});

// Check payments
const samplePayment = await testDb.collection('payments').findOne({});
console.log('\nSample payment fields:', samplePayment ? Object.keys(samplePayment) : 'NO PAYMENTS');
if (samplePayment?.userId) console.log('  userId:', samplePayment.userId);

await client.close();
