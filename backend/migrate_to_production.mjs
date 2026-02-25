/**
 * LOCAL → RAILWAY PRODUCTION Migration Script
 * Copies all collections from local MongoDB to Railway production MongoDB.
 *
 * Usage: node migrate_to_production.mjs
 */

import { MongoClient } from 'mongodb';

const LOCAL_URI = 'mongodb://localhost:27017';
const LOCAL_DB = 'mobile_pos_db';

const RAILWAY_URI = 'mongodb://mongo:ywTpcBRnVIuDMUsmXbPlMQlPitqutIdL@shinkansen.proxy.rlwy.net:22494';
const RAILWAY_DB = 'mobile_pos_db'; // Use the same DB name

const COLLECTIONS_TO_MIGRATE = [
    'users',
    'products',
    'invoices',
    'customers',
    'suppliers',
    'payments',
    'auditlogs',
    'settings',
    'categories',
    'ledgers',
    'supplierledgers',
    'letterheads',
    'purchases',
];

async function migrate() {
    let localClient, railwayClient;

    console.log('\n🚀 Starting database migration: LOCAL → RAILWAY\n');

    try {
        // Connect to both databases
        console.log('📡 Connecting to Local MongoDB...');
        localClient = new MongoClient(LOCAL_URI);
        await localClient.connect();
        console.log('✅ Connected to Local MongoDB\n');

        console.log('📡 Connecting to Railway MongoDB...');
        railwayClient = new MongoClient(RAILWAY_URI, {
            serverSelectionTimeoutMS: 15000,
            connectTimeoutMS: 15000,
        });
        await railwayClient.connect();
        console.log('✅ Connected to Railway MongoDB\n');

        const localDB = localClient.db(LOCAL_DB);
        const railwayDB = railwayClient.db(RAILWAY_DB);

        let totalMigrated = 0;
        let totalSkipped = 0;

        for (const collectionName of COLLECTIONS_TO_MIGRATE) {
            try {
                const localCollection = localDB.collection(collectionName);
                const railwayCollection = railwayDB.collection(collectionName);

                // Count local documents
                const localCount = await localCollection.countDocuments();

                if (localCount === 0) {
                    console.log(`⚪ [${collectionName}] - No local documents, skipping.`);
                    totalSkipped++;
                    continue;
                }

                // Fetch all local documents
                const localDocs = await localCollection.find({}).toArray();
                console.log(`📦 [${collectionName}] - Found ${localCount} local document(s)...`);

                // Clear existing Railway documents (clean migration)
                const railwayCount = await railwayCollection.countDocuments();
                if (railwayCount > 0) {
                    await railwayCollection.deleteMany({});
                    console.log(`🧹 [${collectionName}] - Cleared ${railwayCount} existing Railway document(s).`);
                }

                // Insert all local documents into Railway
                await railwayCollection.insertMany(localDocs);
                console.log(`✅ [${collectionName}] - Migrated ${localCount} document(s) successfully!\n`);
                totalMigrated += localCount;
            } catch (collErr) {
                console.error(`❌ [${collectionName}] - Error: ${collErr.message}`);
            }
        }

        console.log('═══════════════════════════════════════════════');
        console.log(`🎉 Migration Complete!`);
        console.log(`   ✅ Total documents migrated: ${totalMigrated}`);
        console.log(`   ⚪ Collections skipped (empty): ${totalSkipped}`);
        console.log('═══════════════════════════════════════════════\n');

    } catch (err) {
        console.error('\n❌ Migration Failed:', err.message);
        process.exit(1);
    } finally {
        if (localClient) await localClient.close();
        if (railwayClient) await railwayClient.close();
        console.log('🔌 Database connections closed.');
    }
}

migrate();
