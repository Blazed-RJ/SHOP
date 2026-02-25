import { MongoClient, ObjectId } from 'mongodb';
const client = new MongoClient('mongodb://mongo:ywTpcBRnVIuDMUsmXbPlMQlPitqutIdL@shinkansen.proxy.rlwy.net:22494');
await client.connect();

// Check mobile_pos_db for the original sharogiadigital user
const sourceDb = client.db('mobile_pos_db');
const users = await sourceDb.collection('users').find({}).toArray();
console.log('Users in mobile_pos_db:');
users.forEach(u => console.log(`  _id: ${u._id}, username: ${u.username}, email: ${u.email}, role: ${u.role}`));

// Also check old user IDs that products are linked to
const testDb = client.db('test');
const distinctUserIds = ['697d2f081e1290f08e14629d', '64e622f46258907f1418b765',
    '697d34ea1e1290f08e1462d2', '697d368b1e1290f08e1462f8',
    '697e4d3a4e10b7366f096a50', '6998a3b6f96c0e1f165d0036', '6998b6f9f96c0e1f165d0284'];

console.log('\nProduct counts per old userId:');
for (const uid of distinctUserIds) {
    const count = await testDb.collection('products').countDocuments({ user: new ObjectId(uid) });
    // Try to find this user in test DB
    const user = await testDb.collection('users').findOne({ _id: new ObjectId(uid) });
    console.log(`  ${uid}: ${count} products → user: ${user?.username || 'NOT FOUND IN USERS'}`);
}

await client.close();
