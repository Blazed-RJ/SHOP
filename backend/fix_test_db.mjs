/**
 * Fix: Reset passwords for users in the Railway 'test' database
 * (Railway's MONGODB_URI without DB name defaults to 'test')
 */
import bcryptjs from 'bcryptjs';
import { MongoClient } from 'mongodb';

const RAILWAY_URI = 'mongodb://mongo:ywTpcBRnVIuDMUsmXbPlMQlPitqutIdL@shinkansen.proxy.rlwy.net:22494';
const TARGET_DB = 'test'; // Railway defaults to this when no DB in URI

async function fixTestDb() {
    const client = new MongoClient(RAILWAY_URI, { serverSelectionTimeoutMS: 15000 });
    await client.connect();
    console.log('✅ Connected to Railway MongoDB (test DB)');

    const db = client.db(TARGET_DB);

    // 1. List current users in test DB
    const existingUsers = await db.collection('users').find({}, { projection: { username: 1, role: 1, email: 1, _id: 0 } }).toArray();
    console.log('\n📋 Current users in test DB:', JSON.stringify(existingUsers, null, 2));

    // 2. Reset passwords for admin and other users to known value
    const newHash = await bcryptjs.hash('admin123', 10);

    // Update all users in test DB 
    for (const user of existingUsers) {
        await db.collection('users').updateOne(
            { username: user.username },
            { $set: { password: newHash, trustedDevices: [] } }
        );
        console.log(`✅ Reset password for: ${user.username} → admin123`);
    }

    // 3. Check products in test DB
    const productCount = await db.collection('products').countDocuments();
    console.log(`\n📦 Products in test DB: ${productCount}`);

    const customerCount = await db.collection('customers').countDocuments();
    console.log(`👥 Customers in test DB: ${customerCount}`);

    await client.close();
    console.log('\n🎉 Done! All users in test DB have password: admin123');
}

fixTestDb().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
