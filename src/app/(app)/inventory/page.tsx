import { db } from '@/db';
import { inventoryItems, batchRegistry, suppliers } from '@/db/schema';
import { eq, asc, desc } from 'drizzle-orm';
import InventoryClient from './inventory-client';

export default async function InventoryPage() {
  const [items, allSuppliers] = await Promise.all([
    db
      .select({
        id: inventoryItems.id,
        name: inventoryItems.name,
        sku: inventoryItems.sku,
        category: inventoryItems.category,
        gstRate: inventoryItems.gstRate,
        sellingPricePaise: inventoryItems.sellingPricePaise,
        basePricePaise: inventoryItems.basePricePaise,
        totalStock: inventoryItems.totalStockPrimary,
        primaryUnit: inventoryItems.primaryUnit,
        lowStockThreshold: inventoryItems.lowStockThreshold,
        isActive: inventoryItems.isActive,
        hsnCode: inventoryItems.hsnCode,
      })
      .from(inventoryItems)
      .orderBy(asc(inventoryItems.name)),
    db
      .select({ id: suppliers.id, name: suppliers.name })
      .from(suppliers)
      .orderBy(asc(suppliers.name)),
  ]);

  // Get batch counts per item
  const batches = await db
    .select({
      inventoryItemId: batchRegistry.inventoryItemId,
      id: batchRegistry.id,
      batchNumber: batchRegistry.batchNumber,
      quantityPrimary: batchRegistry.quantityPrimary,
      expiryDate: batchRegistry.expiryDate,
    })
    .from(batchRegistry)
    .orderBy(asc(batchRegistry.expiryDate));

  return <InventoryClient items={items} batches={batches} suppliers={allSuppliers} />;
}
