import { MongoClient, ObjectId } from 'mongodb';
const client = new MongoClient('mongodb://mongo:ywTpcBRnVIuDMUsmXbPlMQlPitqutIdL@shinkansen.proxy.rlwy.net:22494');
await client.connect();
const db = client.db('test');

const sharoId = new ObjectId('699dff41c8e63d0b41522995');

// Check if Sahu already exists (case-insensitive)
const existing = await db.collection('suppliers').findOne({
    name: { $regex: /^sahu$/i },
    user: sharoId
});

if (existing) {
    console.log('Sahu already exists:', existing.name, '| isActive:', existing.isActive);
    // Make sure it's active
    await db.collection('suppliers').updateOne({ _id: existing._id }, { $set: { isActive: true, isDeleted: false } });
    console.log('✅ Ensured isActive: true');
} else {
    const result = await db.collection('suppliers').insertOne({
        name: 'Sahu',
        user: sharoId,
        company: '',
        type: 'Supplier',
        phone: '',
        email: null,
        address: '',
        gstNumber: null,
        balance: 0,
        isActive: true,
        isDeleted: false,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0
    });
    console.log('✅ Created supplier Sahu with _id:', result.insertedId);
}

// Show final list
const all = await db.collection('suppliers').find({ user: sharoId, isActive: true }).toArray();
console.log('\nAll active suppliers for sharogiadigital:');
all.forEach(s => console.log(`  - ${s.name}`));

await client.close();
