import { db } from '@/db';
import { salesLedger, invoiceDetails, inventoryItems, customers } from '@/db/schema';
import { eq, gte, lte, and, sql } from 'drizzle-orm';
import GstReportsClient from './gst-reports-client';

interface PageProps {
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function GstReportsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const from = params.from ? new Date(params.from) : firstOfMonth;
  const to = params.to ? new Date(params.to) : today;

  // Set to end of day
  to.setHours(23, 59, 59, 999);

  const sales = await db
    .select({
      id: salesLedger.id,
      invoiceNumber: salesLedger.invoiceNumber,
      createdAt: salesLedger.createdAt,
      grandTotalPaise: salesLedger.grandTotalPaise,
      subtotalPaise: salesLedger.subtotalPaise,
      cgstPaise: salesLedger.cgstPaise,
      sgstPaise: salesLedger.sgstPaise,
      igstPaise: salesLedger.igstPaise,
      paymentMethod: salesLedger.paymentMethod,
      customerName: customers.name,
      customerGstin: customers.gstin,
    })
    .from(salesLedger)
    .leftJoin(customers, eq(salesLedger.customerId, customers.id))
    .where(and(gte(salesLedger.createdAt, from), lte(salesLedger.createdAt, to)))
    .orderBy(salesLedger.createdAt);

  const summaryByRate = await db
    .select({
      gstRate: invoiceDetails.gstRateAtSale,
      taxableAmount: sql<number>`sum(${invoiceDetails.totalLineAmountPaise} - ${invoiceDetails.totalLineCgstPaise} - ${invoiceDetails.totalLineSgstPaise} - ${invoiceDetails.totalLineIgstPaise})`,
      totalCgst: sql<number>`sum(${invoiceDetails.totalLineCgstPaise})`,
      totalSgst: sql<number>`sum(${invoiceDetails.totalLineSgstPaise})`,
      totalIgst: sql<number>`sum(${invoiceDetails.totalLineIgstPaise})`,
    })
    .from(invoiceDetails)
    .innerJoin(salesLedger, eq(invoiceDetails.saleId, salesLedger.id))
    .where(and(gte(salesLedger.createdAt, from), lte(salesLedger.createdAt, to)))
    .groupBy(invoiceDetails.gstRateAtSale)
    .orderBy(invoiceDetails.gstRateAtSale);

  return <GstReportsClient sales={sales} summaryByRate={summaryByRate} fromDate={from.toISOString().split('T')[0]} toDate={to.toISOString().split('T')[0]} />;
}
