import bcryptjs from 'bcryptjs';
import { MongoClient } from 'mongodb';

const RAILWAY_URI = 'mongodb://mongo:ywTpcBRnVIuDMUsmXbPlMQlPitqutIdL@shinkansen.proxy.rlwy.net:22494';
const NEW_PASSWORD = 'Shop@2026';

async function resetPasswords() {
    const client = new MongoClient(RAILWAY_URI, { serverSelectionTimeoutMS: 15000 });
    await client.connect();
    console.log('✅ Connected to Railway MongoDB');

    const db = client.db('mobile_pos_db');
    const newHash = await bcryptjs.hash(NEW_PASSWORD, 10);

    // Reset passwords and clear trusted devices for all test users
    const usernames = ['admin', 'final_admin', 'testuser', 'test1'];

    for (const username of usernames) {
        const result = await db.collection('users').updateOne(
            { username },
            { $set: { password: newHash, trustedDevices: [] } }
        );
        if (result.modifiedCount > 0) {
            console.log(`✅ Reset password for: ${username}`);
        } else {
            console.log(`⚠️  User not found: ${username}`);
        }
    }

    // Verify
    const admin = await db.collection('users').findOne({ username: 'admin' }, { projection: { username: 1, email: 1, role: 1 } });
    console.log('\n📋 Admin account:', JSON.stringify(admin));
    console.log(`\n🎉 All passwords set to: ${NEW_PASSWORD}`);

    await client.close();
    console.log('🔌 Disconnected');
}

resetPasswords().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
