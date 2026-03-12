import { db } from '@/db';
import { inventoryItems, batchRegistry } from '@/db/schema';
import { eq, and, gt, asc } from 'drizzle-orm';
import POSClient from './pos-client';

// Server component — fetches live inventory for the POS
export default async function POSPage() {
  // Fetch all active items that have stock
  const items = await db
    .select({
      id: inventoryItems.id,
      name: inventoryItems.name,
      sku: inventoryItems.sku,
      gstRate: inventoryItems.gstRate,
      sellingPricePaise: inventoryItems.sellingPricePaise,
      totalStock: inventoryItems.totalStockPrimary,
      primaryUnit: inventoryItems.primaryUnit,
      category: inventoryItems.category,
    })
    .from(inventoryItems)
    .where(and(eq(inventoryItems.isActive, true), gt(inventoryItems.totalStockPrimary, 0)))
    .orderBy(asc(inventoryItems.name));

  // For each item, get the first FEFO batch (nearest expiry with stock)
  const itemsWithBatch = await Promise.all(
    items.map(async (item) => {
      const [batch] = await db
        .select({ id: batchRegistry.id, batchNumber: batchRegistry.batchNumber })
        .from(batchRegistry)
        .where(and(eq(batchRegistry.inventoryItemId, item.id), gt(batchRegistry.quantityPrimary, 0)))
        .orderBy(asc(batchRegistry.expiryDate))
        .limit(1);

      return { ...item, batchId: batch?.id ?? null, batchNumber: batch?.batchNumber ?? null };
    })
  );

  return <POSClient items={itemsWithBatch} upiId={process.env.UPI_ID} />;
}
