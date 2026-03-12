'use client';

import { useState } from 'react';
import GstinLookup from '@/components/ui/GstinLookup';

interface Customer {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  gstin: string | null;
  address: string | null;
  loyaltyPoints: number | null;
  createdAt: Date | null;
}

export default function CustomersClient({ customers }: { customers: Customer[] }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Customer | null>(null);
  const [alertStatus, setAlertStatus] = useState('');

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone ?? '').includes(search) ||
    (c.gstin ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const sendLowStockAlert = async (phone: string) => {
    setAlertStatus('Sending...');
    try {
      const res = await fetch('/api/notifications/low-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, method: 'whatsapp' }),
      });
      const data = await res.json();
      if (data.waLink) { window.open(data.waLink, '_blank'); setAlertStatus('✅ WA Opened'); }
      else setAlertStatus(data.message || '✅ Sent');
    } catch {
      setAlertStatus('❌ Error');
    }
    setTimeout(() => setAlertStatus(''), 3000);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="border-b border-[#1e1d24] pb-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Customers</h1>
          <p className="text-[#8a8695] text-sm mt-0.5">{customers.length} customers registered</p>
        </div>
        <input
          type="text"
          placeholder="Search name, phone, or GSTIN..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-[#1a1920] border border-[#2a2836] rounded-xl px-4 py-2 text-sm text-white placeholder:text-[#5a5668] focus:outline-none focus:border-amber-500/50 w-72"
        />
      </div>

      <div className="flex gap-5">
        {/* List */}
        <div className="flex-1 bg-[#1a1920] border border-[#2a2836] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-black/20">
              <tr className="text-left text-[9px] text-[#8a8695] uppercase tracking-widest">
                {['Name', 'Phone', 'GSTIN', 'Points'].map(h => (
                  <th key={h} className="px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1d24]">
              {filtered.map(c => (
                <tr
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className={`cursor-pointer transition-colors hover:bg-white/3 ${selected?.id === c.id ? 'bg-amber-500/10' : ''}`}
                >
                  <td className="px-4 py-3 font-medium text-white">{c.name}</td>
                  <td className="px-4 py-3 text-[#8a8695] font-mono text-xs">{c.phone || '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#8a8695]">{c.gstin || '—'}</td>
                  <td className="px-4 py-3 text-amber-400 font-bold text-xs">{c.loyaltyPoints ?? 0} pts</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-[#5a5668]">No customers found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="w-80 bg-[#1a1920] border border-[#2a2836] rounded-2xl p-5 space-y-5 shrink-0">
            <div>
              <div className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">Customer</div>
              <div className="text-lg font-black text-white">{selected.name}</div>
              {selected.phone && <div className="text-sm text-[#8a8695] mt-0.5">📱 {selected.phone}</div>}
              {selected.email && <div className="text-sm text-[#8a8695]">📧 {selected.email}</div>}
              {selected.address && <div className="text-sm text-[#8a8695]">📍 {selected.address}</div>}
              <div className="mt-2 inline-flex items-center bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1 text-xs text-amber-400 font-bold">
                ⭐ {selected.loyaltyPoints ?? 0} loyalty points
              </div>
            </div>

            {/* GSTIN Lookup */}
            <div>
              <div className="text-xs font-bold text-[#8a8695] uppercase tracking-widest mb-2">GSTIN Lookup</div>
              <GstinLookup
                initialGstin={selected.gstin ?? ''}
                onFound={(data) => console.log('GSTIN data:', data)}
              />
            </div>

            {/* Low Stock Alert */}
            {selected.phone && (
              <div>
                <div className="text-xs font-bold text-[#8a8695] uppercase tracking-widest mb-2">Restock Alert</div>
                <button
                  onClick={() => sendLowStockAlert(selected.phone!)}
                  className="w-full bg-green-600/20 hover:bg-green-600/30 border border-green-600/30 text-green-400 text-sm font-bold py-2.5 rounded-xl transition-colors"
                >
                  {alertStatus || '💬 Send Low Stock Alert on WA'}
                </button>
                <p className="text-[10px] text-[#5a5668] mt-1.5">Opens WhatsApp with a list of items that need restocking</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
