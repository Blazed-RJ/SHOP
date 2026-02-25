import { MongoClient, ObjectId } from 'mongodb';
const client = new MongoClient('mongodb://mongo:ywTpcBRnVIuDMUsmXbPlMQlPitqutIdL@shinkansen.proxy.rlwy.net:22494');
await client.connect();
const db = client.db('test');

const sharoId = new ObjectId('699dff41c8e63d0b41522995');

// Count products per user
const allProducts = await db.collection('products').find({}, { projection: { user: 1 } }).toArray();
const sharoProducts = allProducts.filter(p => p.user?.toString() === sharoId.toString());
const noUserProducts = allProducts.filter(p => !p.user);
const otherProducts = allProducts.filter(p => p.user && p.user.toString() !== sharoId.toString());
console.log(`Products total: ${allProducts.length}`);
console.log(`  sharogiadigital: ${sharoProducts.length}`);
console.log(`  no user field: ${noUserProducts.length}`);
console.log(`  other users: ${otherProducts.length}`);

// Distinct user IDs in products
const distinctUsers = [...new Set(allProducts.filter(p => p.user).map(p => p.user.toString()))];
console.log('Distinct product user IDs:', distinctUsers);

// Check invoices
const allInvoices = await db.collection('invoices').find({}, { projection: { user: 1, createdBy: 1 } }).toArray();
console.log('\nInvoices total:', allInvoices.length);
allInvoices.forEach(inv => console.log('  user:', inv.user?.toString(), 'createdBy:', inv.createdBy?.toString()));

// Check customers
const allCustomers = await db.collection('customers').find({}, { projection: { user: 1, name: 1 } }).limit(5).toArray();
console.log('\nSample customers:');
allCustomers.forEach(c => console.log(`  ${c.name} → user: ${c.user?.toString() || 'none'}`));

await client.close();
