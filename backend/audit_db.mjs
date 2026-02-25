import { MongoClient } from 'mongodb';

const RAILWAY_URI = 'mongodb://mongo:ywTpcBRnVIuDMUsmXbPlMQlPitqutIdL@shinkansen.proxy.rlwy.net:22494';

const client = new MongoClient(RAILWAY_URI, { serverSelectionTimeoutMS: 15000 });
await client.connect();

const testDb = client.db('test');
const sourceDb = client.db('mobile_pos_db');

// Audit all collections in both DBs
const testCollections = await testDb.listCollections().toArray();
const sourceCollections = await sourceDb.listCollections().toArray();

console.log('=== RAILWAY test DB COLLECTIONS ===');
for (const col of testCollections) {
    const count = await testDb.collection(col.name).countDocuments();
    console.log(`  ${col.name}: ${count} documents`);
}

console.log('\n=== SOURCE mobile_pos_db COLLECTIONS ===');
for (const col of sourceCollections) {
    const count = await sourceDb.collection(col.name).countDocuments();
    console.log(`  ${col.name}: ${count} documents`);
}

await client.close();
