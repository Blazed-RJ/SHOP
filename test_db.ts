import { db } from './src/db/index';
import { 
    users, 
    inventoryItems, 
    batchRegistry, 
    suppliers 
} from './src/db/schema';

import { eq } from 'drizzle-orm';

async function main() {
    try {
        console.log("Seeding test data into SQLite...");

        // 1. Create a supplier
        const [supplier] = await db.insert(suppliers).values({
            name: "Cipla Pharmaceuticals India",
            contactPerson: "Raj Kumar",
            phone: "9876543210"
        }).returning({ insertedId: suppliers.id });
        
        console.log(`Created supplier: ${supplier.insertedId}`);

        // 2. Create an Inventory Item (Medical Segment)
        const [item] = await db.insert(inventoryItems).values({
            name: "Paracetamol 500mg",
            sku: "PARA-500",
            category: "Medicine",
            gstRate: 12.00,
            basePricePaise: 4000,   // Rs 40.00
            sellingPricePaise: 5000, // Rs 50.00
            primaryUnit: "strip",
            attributes: {
                composition: "Paracetamol BP 500mg",
                schedule: "H1",
                manufacturer: "Cipla"
            }
        }).returning({ insertedId: inventoryItems.id });

        console.log(`Created inventory item (Paracetamol): ${item.insertedId}`);

        // 3. Register a FEFO Batch for the item
        const [batch] = await db.insert(batchRegistry).values({
            inventoryItemId: item.insertedId,
            batchNumber: "B-2026-X1",
            supplierId: supplier.insertedId,
            costPricePaise: 3800, // Buying price
            quantityPrimary: 100, // Bought 100 strips
            expiryDate: new Date('2028-12-31')
        }).returning({ insertedId: batchRegistry.id });

        console.log(`Registered FEFO Batch B-2026-X1: ${batch.insertedId}`);

        // 4. Query the joined data back out
        console.log("\n--- Querying Inventory with Batches ---");
        
        const rawResults = await db.select().from(inventoryItems).leftJoin(batchRegistry, eq(inventoryItems.id, batchRegistry.inventoryItemId));

        // Normally we'd use relations, but let's just log the flat join results raw
        console.dir(rawResults, { depth: null });
        
        console.log("✅ Database Integration Test Passed!");
    } catch (e) {
        console.error("Database Test Failed!", e);
    }
}

main();
