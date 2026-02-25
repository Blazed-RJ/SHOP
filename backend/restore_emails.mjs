import { MongoClient } from 'mongodb';

const RAILWAY_URI = 'mongodb://mongo:ywTpcBRnVIuDMUsmXbPlMQlPitqutIdL@shinkansen.proxy.rlwy.net:22494';

const client = new MongoClient(RAILWAY_URI, { serverSelectionTimeoutMS: 15000 });
await client.connect();
const db = client.db('test');

// Restore each user's own real email
const updates = [
    { username: 'sharogiadigital', email: 'sharogiadigital@gmail.com' },
    { username: 'admin', email: 'rajatchauhan2754@gmail.com' },
    { username: 'rajatchauhan2754', email: 'rajatchauhan2754@gmail.com' },
];

for (const { username, email } of updates) {
    const r = await db.collection('users').updateOne({ username }, { $set: { email } });
    if (r.modifiedCount > 0) console.log(`✅ ${username} → ${email}`);
    else console.log(`~ ${username} already correct`);
}

// Show final state
const users = await db.collection('users').find({}, { projection: { username: 1, email: 1, _id: 0 } }).toArray();
console.log('\n📋 Final emails:');
users.forEach(u => console.log(`  ${u.username}: ${u.email}`));

await client.close();
console.log('\n🎉 Done!');
