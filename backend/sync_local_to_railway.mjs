import { MongoClient, ObjectId } from 'mongodb';

const LOCAL_URI = 'mongodb://localhost:27017';
const RAILWAY_URI = 'mongodb://mongo:ywTpcBRnVIuDMUsmXbPlMQlPitqutIdL@shinkansen.proxy.rlwy.net:22494';
const SHARO_OLD_ID = '64e622f46258907f1418b765'; // original ownerId in local DB
const SHARO_NEW_ID = new ObjectId('699dff41c8e63d0b41522995'); // current Railway userId

const local = new MongoClient(LOCAL_URI);
const railway = new MongoClient(RAILWAY_URI, { serverSelectionTimeoutMS: 15000 });

await Promise.all([local.connect(), railway.connect()]);
console.log('✅ Connected to both DBs');

const localDb = local.db('mobile_pos_db');
const railwayDb = railway.db('test');

// ── Suppliers ──
const localSuppliers = await localDb.collection('suppliers').find({}).toArray();
console.log(`\nLocal suppliers (${localSuppliers.length}):`);
localSuppliers.forEach(s => console.log(`  - ${s.name} | user: ${s.user}`));

if (localSuppliers.length > 0) {
    // Remap old userId → new userId, upsert by name
    for (const s of localSuppliers) {
        const remapped = {
            ...s,
            user: SHARO_NEW_ID,
            isActive: true,
            isDeleted: false
        };
        await railwayDb.collection('suppliers').updateOne(
            { name: s.name, user: SHARO_NEW_ID },
            { $set: remapped },
            { upsert: true }
        );
        console.log(`  ✅ Upserted supplier: ${s.name}`);
    }
}

// ── Also show all Railway suppliers now ──
const railwaySuppliers = await railwayDb.collection('suppliers').find({ user: SHARO_NEW_ID }).toArray();
console.log(`\nRailway suppliers for sharogiadigital (${railwaySuppliers.length}):`);
railwaySuppliers.forEach(s => console.log(`  - ${s.name} | isActive: ${s.isActive}`));

// ── Products count comparison ──
const localProducts = await localDb.collection('products').countDocuments({ user: new ObjectId(SHARO_OLD_ID) });
const railwayProducts = await railwayDb.collection('products').countDocuments({ user: SHARO_NEW_ID });
console.log(`\nProducts — Local: ${localProducts}, Railway: ${railwayProducts}`);

// ── Customers comparison ──
const localCustomers = await localDb.collection('customers').countDocuments({ user: new ObjectId(SHARO_OLD_ID) });
const railwayCustomers = await railwayDb.collection('customers').countDocuments({ user: SHARO_NEW_ID });
console.log(`Customers — Local: ${localCustomers}, Railway: ${railwayCustomers}`);

await Promise.all([local.close(), railway.close()]);
console.log('\n🎉 Done!');
