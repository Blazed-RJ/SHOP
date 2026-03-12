import { NextResponse } from 'next/server';
import { db } from '@/db';
import { inventoryItems } from '@/db/schema';
import { lte, sql } from 'drizzle-orm';

// POST /api/notifications/low-stock
// Fetches low-stock items and sends WhatsApp/SMS via MSG91 or URL-based WhatsApp
export async function POST(req: Request) {
  try {
    const { phone, method = 'whatsapp' } = await req.json();

    if (!phone) return NextResponse.json({ error: 'Phone number required' }, { status: 400 });

    // Fetch low stock items
    const lowStockItems = await db
      .select({ name: inventoryItems.name, stock: inventoryItems.totalStockPrimary, threshold: inventoryItems.lowStockThreshold, unit: inventoryItems.primaryUnit })
      .from(inventoryItems)
      .where(lte(inventoryItems.totalStockPrimary, sql`${inventoryItems.lowStockThreshold}`));

    if (lowStockItems.length === 0) {
      return NextResponse.json({ message: 'All items are adequately stocked!' });
    }

    const message = `🚨 *Low Stock Alert — Neevbill*\n\n${lowStockItems
      .map((i, idx) => `${idx + 1}. *${i.name}*: ${i.stock} ${i.unit || 'pcs'} remaining (threshold: ${i.threshold})`)
      .join('\n')}\n\n_Login to restock: ${process.env.NEXTAUTH_URL || 'https://neevbill.up.railway.app'}_`;

    if (method === 'whatsapp' && !process.env.MSG91_AUTH_KEY) {
      // Fallback: generate a wa.me link the caller can open
      const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      return NextResponse.json({ success: true, method: 'whatsapp_link', waLink, message, itemCount: lowStockItems.length });
    }

    if (method === 'whatsapp' && process.env.MSG91_AUTH_KEY) {
      // MSG91 WhatsApp API
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
      return NextResponse.json({ success: true, method: 'msg91_whatsapp', response: data, itemCount: lowStockItems.length });
    }

    if (method === 'sms' && process.env.MSG91_AUTH_KEY) {
      // MSG91 SMS API
      const smsText = `Low Stock Alert: ${lowStockItems.map(i => `${i.name}(${i.stock})`).join(', ')} - Neevbill`;
      const res = await fetch(`https://api.msg91.com/api/sendhttp.php?authkey=${process.env.MSG91_AUTH_KEY}&mobiles=${phone}&message=${encodeURIComponent(smsText)}&sender=NEEVBL&route=4`, { method: 'GET' });
      const text = await res.text();
      return NextResponse.json({ success: true, method: 'sms', response: text, itemCount: lowStockItems.length });
    }

    return NextResponse.json({ success: false, error: 'MSG91_AUTH_KEY not configured. See walkthrough.md for setup.' }, { status: 501 });
  } catch (error) {
    console.error('[low-stock notification]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// GET - returns current low stock summary
export async function GET() {
  const items = await db
    .select({ name: inventoryItems.name, stock: inventoryItems.totalStockPrimary, threshold: inventoryItems.lowStockThreshold, unit: inventoryItems.primaryUnit })
    .from(inventoryItems)
    .where(lte(inventoryItems.totalStockPrimary, sql`${inventoryItems.lowStockThreshold}`));

  return NextResponse.json({ count: items.length, items });
}
