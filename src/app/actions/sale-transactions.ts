'use server';

import { db } from '@/db';
import { inventoryItems, salesLedger, invoiceDetails, batchRegistry } from '@/db/schema';
import { eq, sql, asc } from 'drizzle-orm';
import { serializeData } from '@/utils/bigint-middleware';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function processSaleTransaction(payload: any) {
  // payload: { cashierId, storeId, customerId?, grandTotalPaise, subtotalPaise..., 
  //            items: [{ inventoryItemId, quantity, priceAtSalePaise, unit... }] }
  
  try {
    const result = await db.transaction(async (tx) => {
      // 1. Create the overarching Sales Ledger Record
      const [sale] = await tx.insert(salesLedger).values({
        invoiceNumber: `INV-${Date.now()}`,
        cashierId: payload.cashierId,
        storeId: payload.storeId,
        customerId: payload.customerId,
        subtotalPaise: payload.subtotalPaise,
        cgstPaise: payload.cgstPaise,
        sgstPaise: payload.sgstPaise,
        igstPaise: payload.igstPaise,
        grandTotalPaise: payload.grandTotalPaise,
        paymentMethod: payload.paymentMethod,
      }).returning();

      // 2. Loop through each line item from the POS
      for (const item of payload.items) {
        
        // --- FEFO & DEDUCTION LOGIC ---
        let quantityToDeduct = item.quantity;
        
        // Lock rows to prevent race conditions during concurrent sales
        const availableBatches = await tx.select()
          .from(batchRegistry)
          .where(eq(batchRegistry.inventoryItemId, item.inventoryItemId))
          .orderBy(asc(batchRegistry.expiryDate)) // First Expire First Out!
          .for('update'); // Row-level lock

        // Deduct from batches
        for (const batch of availableBatches) {
           if (quantityToDeduct <= 0) break;
           
           const deduction = Math.min(batch.quantityPrimary || 0, quantityToDeduct);
           
           if (deduction > 0) {
             // Deduct from this specific batch
             await tx.update(batchRegistry)
               .set({ quantityPrimary: sql`${batchRegistry.quantityPrimary} - ${deduction}` })
               .where(eq(batchRegistry.id, batch.id));
               
             // Add line item tied to this specific batch ID
             await tx.insert(invoiceDetails).values({
               saleId: sale.id,
               inventoryItemId: item.inventoryItemId,
               batchId: batch.id,
               quantity: deduction,
               unit: item.unit,
               priceAtSalePaise: item.priceAtSalePaise,
               gstRateAtSale: item.gstRateAtSale,
               totalLineAmountPaise: (item.priceAtSalePaise * deduction),
             });
             
             quantityToDeduct -= deduction;
           }
        }
        
        if (quantityToDeduct > 0) {
          // If we run out of batches but still need to sell (e.g., negative stock allowed)
          tx.rollback();
          throw new Error(`Insufficient stock for item ID ${item.inventoryItemId}`);
        }

        // --- UPDATE MASTER INVENTORY RECORD ---
        await tx.update(inventoryItems)
          .set({ totalStockPrimary: sql`${inventoryItems.totalStockPrimary} - ${item.quantity}` })
          .where(eq(inventoryItems.id, item.inventoryItemId));
      }

      return sale;
    });

    return { success: true, data: serializeData(result) };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
