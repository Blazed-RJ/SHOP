'use server';

import { db } from '@/db';
import { inventoryItems, batchRegistry, salesLedger, invoiceDetails } from '@/db/schema';
import { eq, lt, and, gt, asc, sql } from 'drizzle-orm';

// ─── FEFO Batch Selector ──────────────────────────────────────────────────────

/**
 * getAvailableBatchesFEFO
 * Returns the available batches for an item sorted by expiry date (First Expire, First Out).
 * The POS screen uses this to auto-select which batch to debit.
 */
export async function getAvailableBatchesFEFO(inventoryItemId: number) {
  const batches = await db
    .select({
      id: batchRegistry.id,
      batchNumber: batchRegistry.batchNumber,
      quantityPrimary: batchRegistry.quantityPrimary,
      expiryDate: batchRegistry.expiryDate,
      costPricePaise: batchRegistry.costPricePaise,
    })
    .from(batchRegistry)
    .where(
      and(
        eq(batchRegistry.inventoryItemId, inventoryItemId),
        gt(batchRegistry.quantityPrimary, 0) // Only batches with stock
      )
    )
    .orderBy(asc(batchRegistry.expiryDate)); // FEFO: nearest expiry first

  return batches;
}

// ─── Low Stock Alert ──────────────────────────────────────────────────────────

/**
 * getLowStockItems
 * Returns items where total stock is at or below the low-stock threshold.
 * Used for the dashboard alert widget.
 */
export async function getLowStockItems(storeId?: number) {
  const items = await db
    .select({
      id: inventoryItems.id,
      name: inventoryItems.name,
      sku: inventoryItems.sku,
      category: inventoryItems.category,
      currentStock: inventoryItems.totalStockPrimary,
      threshold: inventoryItems.lowStockThreshold,
      unit: inventoryItems.primaryUnit,
    })
    .from(inventoryItems)
    .where(
      and(
        eq(inventoryItems.isActive, true),
        sql`${inventoryItems.totalStockPrimary} <= ${inventoryItems.lowStockThreshold}`
      )
    );

  return items;
}

// ─── Dead Stock Alert ─────────────────────────────────────────────────────────

/**
 * getExpiringBatches
 * Returns batches expiring within the next N days. Default: 30 days.
 */
export async function getExpiringBatches(daysAhead = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

  const batches = await db
    .select({
      batchId: batchRegistry.id,
      batchNumber: batchRegistry.batchNumber,
      expiryDate: batchRegistry.expiryDate,
      quantityPrimary: batchRegistry.quantityPrimary,
      itemId: inventoryItems.id,
      itemName: inventoryItems.name,
    })
    .from(batchRegistry)
    .innerJoin(inventoryItems, eq(batchRegistry.inventoryItemId, inventoryItems.id))
    .where(
      and(
        gt(batchRegistry.quantityPrimary, 0),
        lt(batchRegistry.expiryDate, cutoffDate)
      )
    )
    .orderBy(asc(batchRegistry.expiryDate));

  return batches;
}

// ─── Sales Summary ────────────────────────────────────────────────────────────

/**
 * getDailySalesSummary
 * Returns the total sales for today (grand total, cgst, sgst, igst).
 */
export async function getDailySalesSummary(storeId?: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = await db
    .select({
      totalRevenuePaise: sql<number>`COALESCE(SUM(${salesLedger.grandTotalPaise}), 0)`,
      totalCgstPaise:    sql<number>`COALESCE(SUM(${salesLedger.cgstPaise}), 0)`,
      totalSgstPaise:    sql<number>`COALESCE(SUM(${salesLedger.sgstPaise}), 0)`,
      totalIgstPaise:    sql<number>`COALESCE(SUM(${salesLedger.igstPaise}), 0)`,
      invoiceCount:      sql<number>`COUNT(${salesLedger.id})`,
    })
    .from(salesLedger)
    .where(
      and(
        gt(salesLedger.createdAt, today),
        ...(storeId ? [eq(salesLedger.storeId, storeId)] : []),
      )
    );

  return result[0] ?? {
    totalRevenuePaise: 0,
    totalCgstPaise: 0,
    totalSgstPaise: 0,
    totalIgstPaise: 0,
    invoiceCount: 0,
  };
}
