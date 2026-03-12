'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const UpiQrModal = dynamic(() => import('@/components/ui/UpiQrModal'), { ssr: false });

interface Sale {
  id: number;
  invoiceNumber: string;
  createdAt: Date | null;
  grandTotalPaise: number;
  cgstPaise: number | null;
  sgstPaise: number | null;
  igstPaise: number | null;
  paymentMethod: string | null;
  paymentStatus: string | null;
  customerId: number | null;
  customerName: string | null;
  customerPhone: string | null;
  itemCount: number;
}

function paise(p: number | null) { return ((p ?? 0) / 100).toFixed(2); }

export default function InvoicesClient({ sales }: { sales: Sale[] }) {
  const [search, setSearch] = useState('');
  const [upiQr, setUpiQr] = useState<{ amount: number; invoiceNumber: string } | null>(null);
  const [reminderStatus, setReminderStatus] = useState<Record<number, string>>({});

  const filtered = sales.filter(s =>
    s.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
    (s.customerName ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const sendReminder = async (sale: Sale) => {
    if (!sale.customerPhone && !sale.customerId) { setReminderStatus(p => ({ ...p, [sale.id]: 'No phone' })); return; }
    setReminderStatus(p => ({ ...p, [sale.id]: 'Sending...' }));
    try {
      const res = await fetch('/api/notifications/payment-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: sale.id }),
      });
      const data = await res.json();
      if (data.waLink) {
        window.open(data.waLink, '_blank');
        setReminderStatus(p => ({ ...p, [sale.id]: '✅ Opened WA' }));
      } else {
        setReminderStatus(p => ({ ...p, [sale.id]: data.success ? '✅ Sent' : '❌ Failed' }));
      }
    } catch {
      setReminderStatus(p => ({ ...p, [sale.id]: '❌ Error' }));
    }
    setTimeout(() => setReminderStatus(p => { const next = { ...p }; delete next[sale.id]; return next; }), 4000);
  };

  const methodBadge = (m: string | null) => {
    const styles: Record<string, string> = {
      cash: 'bg-green-500/15 text-green-400', upi: 'bg-yellow-500/15 text-yellow-400',
      card: 'bg-blue-500/15 text-blue-400', credit: 'bg-red-500/15 text-red-400',
    };
    return styles[m ?? ''] ?? 'bg-[#2a2836] text-[#8a8695]';
  };

  return (
    <div className="p-6 space-y-5">
      <div className="border-b border-[#1e1d24] pb-4 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Invoice History</h1>
          <p className="text-[#8a8695] text-sm mt-0.5">{sales.length} invoices</p>
        </div>
        <input
          type="text"
          placeholder="Search by invoice # or customer..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-[#1a1920] border border-[#2a2836] rounded-xl px-4 py-2 text-sm text-white placeholder:text-[#5a5668] focus:outline-none focus:border-amber-500/50 w-64"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Revenue', value: `₹${paise(sales.reduce((s, r) => s + r.grandTotalPaise, 0))}` },
          { label: 'Total CGST+SGST', value: `₹${paise(sales.reduce((s, r) => s + (r.cgstPaise ?? 0) + (r.sgstPaise ?? 0), 0))}` },
          { label: 'Total IGST', value: `₹${paise(sales.reduce((s, r) => s + (r.igstPaise ?? 0), 0))}` },
        ].map(c => (
          <div key={c.label} className="bg-[#1a1920] border border-[#2a2836] rounded-2xl p-4">
            <div className="text-[9px] font-bold text-[#8a8695] uppercase tracking-widest mb-1">{c.label}</div>
            <div className="text-lg font-black text-white">{c.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#1a1920] border border-[#2a2836] rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black/20 text-left">
            <tr className="text-[9px] text-[#8a8695] uppercase tracking-widest">
              {['Invoice #', 'Date', 'Customer', 'Items', 'Method', 'Amount', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e1d24]">
            {filtered.map(s => (
              <tr key={s.id} className="hover:bg-white/2 transition-colors">
                <td className="px-4 py-3 font-mono text-amber-400 text-xs">{s.invoiceNumber}</td>
                <td className="px-4 py-3 text-[#8a8695] text-xs whitespace-nowrap">
                  {s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-IN') : '—'}
                </td>
                <td className="px-4 py-3 text-white">{s.customerName || <span className="text-[#5a5668]">Walk-in</span>}</td>
                <td className="px-4 py-3 text-[#8a8695] text-center">{s.itemCount}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${methodBadge(s.paymentMethod)}`}>
                    {s.paymentMethod ?? 'cash'}
                  </span>
                </td>
                <td className="px-4 py-3 font-bold text-white">₹{paise(s.grandTotalPaise)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {s.paymentMethod === 'upi' && (
                      <button
                        onClick={() => setUpiQr({ amount: s.grandTotalPaise / 100, invoiceNumber: s.invoiceNumber })}
                        title="Show UPI QR"
                        className="text-yellow-400 hover:text-yellow-300 text-xs bg-yellow-400/10 px-2 py-1 rounded-lg transition-colors"
                      >
                        📱 QR
                      </button>
                    )}
                    {s.paymentStatus === 'unpaid' && s.customerPhone && (
                      <button
                        onClick={() => sendReminder(s)}
                        className="text-green-400 hover:text-green-300 text-xs bg-green-400/10 px-2 py-1 rounded-lg transition-colors"
                      >
                        {reminderStatus[s.id] || '💬 Remind'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-16 text-center text-[#5a5668]">No invoices found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {upiQr && (
        <UpiQrModal amount={upiQr.amount} invoiceNumber={upiQr.invoiceNumber} onClose={() => setUpiQr(null)} />
      )}
    </div>
  );
}
