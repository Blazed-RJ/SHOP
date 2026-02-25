import { MongoClient } from 'mongodb';

const RAILWAY_URI = 'mongodb://mongo:ywTpcBRnVIuDMUsmXbPlMQlPitqutIdL@shinkansen.proxy.rlwy.net:22494';
const YOUR_EMAIL = 'rajatchauhan2754@gmail.com';

const client = new MongoClient(RAILWAY_URI, { serverSelectionTimeoutMS: 15000 });
await client.connect();
const db = client.db('test');

// Show before
const before = await db.collection('users').find({}, { projection: { username: 1, email: 1, _id: 0 } }).toArray();
console.log('📋 Before:');
before.forEach(u => console.log(`  ${u.username}: ${u.email}`));

// Update ALL users to use your Gmail
const result = await db.collection('users').updateMany({}, { $set: { email: YOUR_EMAIL } });
console.log(`\n✅ Updated ${result.modifiedCount} users → all OTPs now go to ${YOUR_EMAIL}`);

await client.close();
