/**
 * Fix Railway: Migrate all data from mobile_pos_db to test DB
 * (because Railway's MONGODB_URI points to the 'test' database)
 */
import { MongoClient } from 'mongodb';

const RAILWAY_URI = 'mongodb://mongo:ywTpcBRnVIuDMUsmXbPlMQlPitqutIdL@shinkansen.proxy.rlwy.net:22494';
const SOURCE_DB = 'mobile_pos_db';
const TARGET_DB = 'test'; // What Railway SHOP actually connects to

const COLLECTIONS = ['users', 'products', 'invoices', 'customers', 'suppliers',
    'payments', 'auditlogs', 'settings', 'categories', 'letterheads', 'purchases'];

async function migrateToTestDb() {
    const client = new MongoClient(RAILWAY_URI, { serverSelectionTimeoutMS: 15000 });
    await client.connect();
    console.log('✅ Connected to Railway MongoDB\n');

    const sourceDb = client.db(SOURCE_DB);
    const targetDb = client.db(TARGET_DB);

    let totalMigrated = 0;

    for (const collectionName of COLLECTIONS) {
        const sourceDocs = await sourceDb.collection(collectionName).find({}).toArray();

        if (sourceDocs.length === 0) {
            console.log(`⚪ [${collectionName}] Empty in source, skipping.`);
            continue;
        }

        // For users: merge — keep existing Google-created accounts, add local ones that don't exist
        if (collectionName === 'users') {
            console.log(`\n🔀 [users] Merging ${sourceDocs.length} local users into ${TARGET_DB}...`);
            let added = 0;
            for (const user of sourceDocs) {
                const exists = await targetDb.collection('users').findOne({ username: user.username });
                if (!exists) {
                    await targetDb.collection('users').insertOne(user);
                    added++;
                    console.log(`  + Added user: ${user.username} (${user.role})`);
                } else {
                    console.log(`  ~ Kept existing: ${user.username}`);
                }
            }
            console.log(`✅ [users] Added ${added} new users, kept ${sourceDocs.length - added} existing.`);
            continue;
        }

        // For other collections: check target count first
        const targetCount = await targetDb.collection(collectionName).countDocuments();
        if (targetCount > 0) {
            // Clear and re-import
            await targetDb.collection(collectionName).deleteMany({});
        }

        await targetDb.collection(collectionName).insertMany(sourceDocs);
        console.log(`✅ [${collectionName}] Migrated ${sourceDocs.length} docs.`);
        totalMigrated += sourceDocs.length;
    }

    console.log(`\n🎉 Migration complete! ${totalMigrated} documents copied to '${TARGET_DB}' DB.`);
    await client.close();
}

migrateToTestDb().catch(err => {
    console.error('❌ Failed:', err.message);
    process.exit(1);
});
