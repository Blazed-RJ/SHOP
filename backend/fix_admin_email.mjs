import { MongoClient } from 'mongodb';

const RAILWAY_URI = 'mongodb://mongo:ywTpcBRnVIuDMUsmXbPlMQlPitqutIdL@shinkansen.proxy.rlwy.net:22494';
const REAL_EMAIL = 'rajatchauhan2754@gmail.com';

async function fixEmails() {
    const client = new MongoClient(RAILWAY_URI, { serverSelectionTimeoutMS: 15000 });
    await client.connect();
    console.log('✅ Connected');

    const db = client.db('test');

    // Update admin and other fake-email accounts to the real email
    const updates = [
        { username: 'admin', email: REAL_EMAIL },
        { username: 'final_admin', email: REAL_EMAIL },
        { username: 'testuser', email: REAL_EMAIL },
    ];

    for (const { username, email } of updates) {
        const result = await db.collection('users').updateOne(
            { username },
            { $set: { email, trustedDevices: [] } }
        );
        if (result.modifiedCount > 0) {
            console.log(`✅ ${username} → email set to ${email}`);
        }
    }

    // Verify
    const users = await db.collection('users').find(
        { username: { $in: ['admin', 'rajatchauhan2754', 'final_admin'] } },
        { projection: { username: 1, email: 1, _id: 0 } }
    ).toArray();
    console.log('\n📋 Updated users:', JSON.stringify(users, null, 2));

    await client.close();
    console.log('\n🎉 Done! OTP emails will now go to', REAL_EMAIL);
}

fixEmails().catch(err => { console.error('❌', err.message); process.exit(1); });
