import { db } from '@/db';
import { salesLedger, customers, invoiceDetails } from '@/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import InvoicesClient from './invoices-client';

export default async function InvoicesPage() {
  const sales = await db
    .select({
      id: salesLedger.id,
      invoiceNumber: salesLedger.invoiceNumber,
      createdAt: salesLedger.createdAt,
      grandTotalPaise: salesLedger.grandTotalPaise,
      cgstPaise: salesLedger.cgstPaise,
      sgstPaise: salesLedger.sgstPaise,
      igstPaise: salesLedger.igstPaise,
      paymentMethod: salesLedger.paymentMethod,
      paymentStatus: salesLedger.paymentStatus,
      customerId: salesLedger.customerId,
      customerName: customers.name,
      customerPhone: customers.phone,
      itemCount: sql<number>`count(${invoiceDetails.id})`,
    })
    .from(salesLedger)
    .leftJoin(customers, eq(salesLedger.customerId, customers.id))
    .leftJoin(invoiceDetails, eq(invoiceDetails.saleId, salesLedger.id))
    .groupBy(salesLedger.id, customers.id)
    .orderBy(desc(salesLedger.createdAt))
    .limit(200);

  return <InvoicesClient sales={sales} />;
}
