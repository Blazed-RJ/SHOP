'use server';

import { db } from '@/db';
import { batchRegistry, inventoryItems, suppliers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AddBatchInput {
  inventoryItemId: number;
  supplierId?: number | null;
  batchNumber: string;
  costPricePaise: number;        // What we paid per unit
  quantityPrimary: number;       // Stock received in primary unit
  quantitySecondary?: number;    // Optional secondary unit stock
  mfgDate?: Date | null;
  expiryDate?: Date | null;      // Critical for FEFO enforcement
}

export interface AddBatchResult {
  success: boolean;
  batchId?: number;
  error?: string;
}

// ─── Server Action ────────────────────────────────────────────────────────────

/**
 * addInventoryBatch — Records a new stock purchase / incoming batch.
 *
 * 1. Validates the inventory item exists.
 * 2. Inserts the new batch record into `batch_registry`.
 * 3. Updates the master `total_stock_primary` counter on `inventory_items`.
 */
export async function addInventoryBatch(input: AddBatchInput): Promise<AddBatchResult> {
  try {
    // Validate item exists
    const [item] = await db
      .select({ id: inventoryItems.id, stock: inventoryItems.totalStockPrimary })
      .from(inventoryItems)
      .where(eq(inventoryItems.id, input.inventoryItemId));

    if (!item) {
      return { success: false, error: `Inventory item ID ${input.inventoryItemId} not found.` };
    }

    let batchId: number;

    await db.transaction(async (tx) => {
      // Insert the new batch
      const [newBatch] = await tx
        .insert(batchRegistry)
        .values({
          inventoryItemId: input.inventoryItemId,
          supplierId: input.supplierId ?? null,
          batchNumber: input.batchNumber,
          costPricePaise: input.costPricePaise,
          quantityPrimary: input.quantityPrimary,
          quantitySecondary: input.quantitySecondary ?? 0,
          mfgDate: input.mfgDate ?? null,
          expiryDate: input.expiryDate ?? null,
        })
        .returning({ id: batchRegistry.id });

      batchId = newBatch.id;

      // Update master stock counter
      await tx
        .update(inventoryItems)
        .set({
          totalStockPrimary: (item.stock ?? 0) + input.quantityPrimary,
          updatedAt: new Date(),
        })
        .where(eq(inventoryItems.id, input.inventoryItemId));
    });

    revalidatePath('/inventory');

    return { success: true, batchId: batchId! };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[addInventoryBatch] Error:', message);
    return { success: false, error: message };
  }
}
