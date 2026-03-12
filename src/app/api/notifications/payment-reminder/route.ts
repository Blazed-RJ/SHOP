import { NextResponse } from 'next/server';
import { db } from '@/db';
import { salesLedger, customers } from '@/db/schema';
import { eq } from 'drizzle-orm';

// POST /api/notifications/payment-reminder
// Sends payment due reminder via WhatsApp
export async function POST(req: Request) {
  try {
    const { invoiceId, customPhone } = await req.json();
    if (!invoiceId) return NextResponse.json({ error: 'invoiceId required' }, { status: 400 });

    const [sale] = await db
      .select({
        invoiceNumber: salesLedger.invoiceNumber,
        grandTotalPaise: salesLedger.grandTotalPaise,
        paymentStatus: salesLedger.paymentStatus,
        customerName: customers.name,
        customerPhone: customers.phone,
        createdAt: salesLedger.createdAt,
      })
      .from(salesLedger)
      .leftJoin(customers, eq(salesLedger.customerId, customers.id))
      .where(eq(salesLedger.id, invoiceId));

    if (!sale) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

    const phone = customPhone || sale.customerPhone;
    if (!phone) return NextResponse.json({ error: 'No phone number for customer' }, { status: 400 });

    const amount = (sale.grandTotalPaise / 100).toFixed(2);
    const message = `Dear ${sale.customerName || 'Customer'},\n\nThis is a gentle reminder that payment of *₹${amount}* is due for Invoice No. *${sale.invoiceNumber}*.\n\nPlease clear the balance at your earliest convenience.\n\nThank you,\n_Neevbill_`;

    // Generate WhatsApp link (universal, no API key needed)
    const waLink = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;

    // If MSG91 configured, use WhatsApp API
    if (process.env.MSG91_AUTH_KEY) {
      const res = await fetch('https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authkey: process.env.MSG91_AUTH_KEY },
        body: JSON.stringify({
          integrated_number: process.env.MSG91_FROM_NUMBER,
          content_type: 'template',
          payload: { to: phone, type: 'text', text: { body: message } },
        }),
      });
      const data = await res.json();
      return NextResponse.json({ success: true, method: 'msg91', response: data });
    }

    // Fallback: return the wa.me link for the frontend to open
    return NextResponse.json({ success: true, method: 'whatsapp_link', waLink, message });
  } catch (error) {
    console.error('[payment-reminder]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
