/**
 * Clean re-migration from mobile_pos_db → test
 * Wipes test DB collections and refills from source
 * Users are MERGED (not wiped) to preserve accounts
 */
import { MongoClient } from 'mongodb';

const RAILWAY_URI = 'mongodb://mongo:ywTpcBRnVIuDMUsmXbPlMQlPitqutIdL@shinkansen.proxy.rlwy.net:22494';
const SOURCE_DB = 'mobile_pos_db';
const TARGET_DB = 'test';

const client = new MongoClient(RAILWAY_URI, { serverSelectionTimeoutMS: 15000 });
await client.connect();
console.log('✅ Connected');

const sourceDb = client.db(SOURCE_DB);
const targetDb = client.db(TARGET_DB);

// Get all source collections
const sourceCollections = await sourceDb.listCollections().toArray();
console.log(`\n📦 Source collections: ${sourceCollections.map(c => c.name).join(', ')}\n`);

for (const col of sourceCollections) {
    const name = col.name;
    const sourceDocs = await sourceDb.collection(name).find({}).toArray();

    if (name === 'users') {
        // MERGE users: keep existing test DB users, add missing ones from source
        const targetUsers = await targetDb.collection(name).find({}).toArray();
        const targetUsernames = new Set(targetUsers.map(u => u.username));
        const toInsert = sourceDocs.filter(u => !targetUsernames.has(u.username));
        if (toInsert.length > 0) {
            await targetDb.collection(name).insertMany(toInsert);
            console.log(`👥 users: merged ${toInsert.length} from source`);
        } else {
            console.log(`👥 users: no new users to merge`);
        }
    } else {
        // All other collections: wipe and replace with source data
        const beforeCount = await targetDb.collection(name).countDocuments();
        await targetDb.collection(name).deleteMany({});
        if (sourceDocs.length > 0) {
            await targetDb.collection(name).insertMany(sourceDocs);
        }
        console.log(`✅ ${name}: ${beforeCount} → ${sourceDocs.length} documents`);
    }
}

// Final count
console.log('\n=== FINAL TEST DB STATE ===');
const finalCols = await targetDb.listCollections().toArray();
for (const col of finalCols) {
    const count = await targetDb.collection(col.name).countDocuments();
    console.log(`  ${col.name}: ${count}`);
}

await client.close();
console.log('\n🎉 Migration complete!');
