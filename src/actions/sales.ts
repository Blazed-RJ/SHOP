'use server';

import { db } from '@/db';
import {
  salesLedger,
  invoiceDetails,
  batchRegistry,
  inventoryItems,
  customers,
} from '@/db/schema';
import { eq, asc, and, gt } from 'drizzle-orm';
import { calculateGST, applyRoundingEngine } from '@/utils/gst-calculator';
import { revalidatePath } from 'next/cache';

const OUR_STATE_CODE = process.env.OWN_STATE_CODE ?? '02'; // Default: Himachal Pradesh

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SaleLineItem {
  inventoryItemId: number;
  batchId: number;           // Specific FEFO batch to debit stock from
  quantity: number;
  unit: string;
  priceAtSalePaise: number;  // Selling price at time of sale
  gstRate: number;           // GST rate in % (e.g., 12.0)
}

export interface CreateSaleInput {
  lineItems: SaleLineItem[];
  customerId?: number | null;
  cashierId: number;
  storeId?: number | null;
  paymentMethod: 'cash' | 'upi' | 'card' | 'credit';
  discountPaise?: number;
  customerGSTIN?: string | null; // For IGST vs CGST/SGST decision
}

export interface CreateSaleResult {
  success: boolean;
  invoiceNumber?: string;
  grandTotalPaise?: number;
  error?: string;
}

// ─── Generate Invoice Number ──────────────────────────────────────────────────

function generateInvoiceNumber(storeId: number | null | undefined): string {
  const prefix = storeId ? `S${storeId}` : 'POS';
  const timestamp = Date.now();
  return `${prefix}-INV-${timestamp}`;
}

// ─── Main Server Action ───────────────────────────────────────────────────────

/**
 * createSale — Atomic POS Transaction
 *
 * This is the heart of the ERP. It performs the following in a single
 * PostgreSQL transaction, so either ALL steps succeed or NONE do:
 *
 * 1. Validates stock is available in the requested FEFO batch.
 * 2. Calculates GST for each line item (CGST/SGST vs IGST).
 * 3. Applies the "nearest rupee" rounding rule.
 * 4. Writes the `sales_ledger` header record.
 * 5. Writes each `invoice_details` line item.
 * 6. Debits stock from `batch_registry` (FEFO enforcement).
 * 7. Updates `inventory_items.total_stock_primary`.
 */
export async function createSale(input: CreateSaleInput): Promise<CreateSaleResult> {
  try {
    // Look up customer GSTIN if not provided directly
    let customerGSTIN = input.customerGSTIN ?? null;
    if (!customerGSTIN && input.customerId) {
      const [cust] = await db
        .select({ gstin: customers.gstin })
        .from(customers)
        .where(eq(customers.id, input.customerId));
      customerGSTIN = cust?.gstin ?? null;
    }

    // ── Step 1: Validate all stock BEFORE starting transaction ──
    for (const item of input.lineItems) {
      const [batch] = await db
        .select({ qty: batchRegistry.quantityPrimary })
        .from(batchRegistry)
        .where(eq(batchRegistry.id, item.batchId));

      if (!batch || (batch.qty ?? 0) < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock in batch ID ${item.batchId}. Available: ${batch?.qty ?? 0}, Requested: ${item.quantity}`,
        };
      }
    }

    // ── Step 2: Calculate totals ──
    let subtotalPaise = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    const lineResults: Array<SaleLineItem & {
      cgst: number; sgst: number; igst: number; lineTotal: number;
    }> = [];

    for (const item of input.lineItems) {
      const taxable = item.priceAtSalePaise * item.quantity;
      const gst = calculateGST(taxable, item.gstRate, customerGSTIN, OUR_STATE_CODE);

      subtotalPaise += taxable;
      totalCgst += gst.cgstPaise;
      totalSgst += gst.sgstPaise;
      totalIgst += gst.igstPaise;

      lineResults.push({
        ...item,
        cgst: gst.cgstPaise,
        sgst: gst.sgstPaise,
        igst: gst.igstPaise,
        lineTotal: taxable + gst.totalTaxPaise,
      });
    }

    const discount = input.discountPaise ?? 0;
    const preRoundTotal = subtotalPaise + totalCgst + totalSgst + totalIgst - discount;
    const { roundedGrandTotalPaise, roundOffDiffPaise } = applyRoundingEngine(preRoundTotal);

    const invoiceNumber = generateInvoiceNumber(input.storeId);

    // ── Step 3: Write to DB (atomic via Postgres transaction) ──
    await db.transaction(async (tx) => {
      // 3a. Insert sales header
      const [sale] = await tx
        .insert(salesLedger)
        .values({
          invoiceNumber,
          customerId: input.customerId,
          cashierId: input.cashierId,
          storeId: input.storeId,
          subtotalPaise,
          cgstPaise: totalCgst,
          sgstPaise: totalSgst,
          igstPaise: totalIgst,
          discountPaise: discount,
          roundOffPaise: roundOffDiffPaise,
          grandTotalPaise: roundedGrandTotalPaise,
          paymentMethod: input.paymentMethod,
          paymentStatus: 'paid',
        })
        .returning({ id: salesLedger.id });

      const saleId = sale.id;

      // 3b. Insert line items & debit stock
      for (const line of lineResults) {
        // Insert invoice detail
        await tx.insert(invoiceDetails).values({
          saleId: saleId,
          inventoryItemId: line.inventoryItemId,
          batchId: line.batchId,
          quantity: line.quantity,
          unit: line.unit,
          priceAtSalePaise: line.priceAtSalePaise,
          gstRateAtSale: line.gstRate,
          totalLineCgstPaise: line.cgst,
          totalLineSgstPaise: line.sgst,
          totalLineIgstPaise: line.igst,
          totalLineAmountPaise: line.lineTotal,
        });

        // Debit batch stock
        const [currentBatch] = await tx
          .select({ qty: batchRegistry.quantityPrimary })
          .from(batchRegistry)
          .where(eq(batchRegistry.id, line.batchId));

        await tx
          .update(batchRegistry)
          .set({ quantityPrimary: (currentBatch.qty ?? 0) - line.quantity })
          .where(eq(batchRegistry.id, line.batchId));

        // Debit master inventory counter
        const [currentItem] = await tx
          .select({ stock: inventoryItems.totalStockPrimary })
          .from(inventoryItems)
          .where(eq(inventoryItems.id, line.inventoryItemId));

        await tx
          .update(inventoryItems)
          .set({ totalStockPrimary: (currentItem.stock ?? 0) - line.quantity })
          .where(eq(inventoryItems.id, line.inventoryItemId));
      }
    });

    revalidatePath('/inventory');
    revalidatePath('/pos');

    return {
      success: true,
      invoiceNumber,
      grandTotalPaise: roundedGrandTotalPaise,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[createSale] Error:', message);
    return { success: false, error: message };
  }
}
