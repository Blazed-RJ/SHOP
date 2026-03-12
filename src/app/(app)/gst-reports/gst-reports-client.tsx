'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Sale {
  id: number;
  invoiceNumber: string;
  createdAt: Date | null;
  grandTotalPaise: number;
  subtotalPaise: number;
  cgstPaise: number | null;
  sgstPaise: number | null;
  igstPaise: number | null;
  paymentMethod: string | null;
  customerName: string | null;
  customerGstin: string | null;
}

interface RateSummary {
  gstRate: number;
  taxableAmount: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
}

function paise(p: number | null) { return ((p ?? 0) / 100).toFixed(2); }

export default function GstReportsClient({
  sales, summaryByRate, fromDate, toDate
}: { sales: Sale[]; summaryByRate: RateSummary[]; fromDate: string; toDate: string }) {
  const router = useRouter();
  const [from, setFrom] = useState(fromDate);
  const [to, setTo] = useState(toDate);

  const totalCgst = sales.reduce((s, r) => s + (r.cgstPaise ?? 0), 0);
  const totalSgst = sales.reduce((s, r) => s + (r.sgstPaise ?? 0), 0);
  const totalIgst = sales.reduce((s, r) => s + (r.igstPaise ?? 0), 0);
  const totalTax = totalCgst + totalSgst + totalIgst;
  const totalTurnover = sales.reduce((s, r) => s + r.grandTotalPaise, 0);

  const downloadGSTR1 = () => {
    const gstr1 = {
      gstin: process.env.NEXT_PUBLIC_GSTIN || 'YOUR_GSTIN',
      fp: new Date(fromDate).toLocaleDateString('en-IN', { month: '2-digit', year: 'numeric' }).replace('/', ''),
      gt: totalTurnover / 100,
      b2c_others: sales
        .filter(s => !s.customerGstin)
        .map(s => ({
          typ: 'OE',
          pos: '02',
          val: s.grandTotalPaise / 100,
          iamt: (s.igstPaise ?? 0) / 100,
          camt: (s.cgstPaise ?? 0) / 100,
          samt: (s.sgstPaise ?? 0) / 100,
        })),
      b2b: sales
        .filter(s => s.customerGstin)
        .map(s => ({
          ctin: s.customerGstin,
          inv: [{
            inum: s.invoiceNumber,
            idt: s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-IN') : '',
            val: s.grandTotalPaise / 100,
            pos: s.customerGstin?.substring(0, 2),
            rchrg: 'N',
            itms: [{ num: 1, itm_det: { taxval: s.subtotalPaise / 100, iamt: (s.igstPaise ?? 0) / 100, camt: (s.cgstPaise ?? 0) / 100, samt: (s.sgstPaise ?? 0) / 100 } }]
          }]
        })),
    };
    const blob = new Blob([JSON.stringify(gstr1, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `GSTR1_${fromDate}_${toDate}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadGSTR3B = () => {
    const gstr3b = {
      gstin: process.env.NEXT_PUBLIC_GSTIN || 'YOUR_GSTIN',
      ret_period: new Date(fromDate).toLocaleDateString('en-IN', { month: '2-digit', year: 'numeric' }).replace('/', ''),
      sup_details: {
        osup_det: {
          txval: (totalTurnover - totalTax) / 100,
          iamt: totalIgst / 100,
          camt: totalCgst / 100,
          samt: totalSgst / 100,
          csamt: 0,
        },
      },
      intr_ltfee: { intr_details: { iamt: 0, camt: 0, samt: 0, csamt: 0 } },
      tax_pay: { rdm_tax: { iamt: 0, camt: 0, samt: 0, csamt: 0 }, tax_pay: { iamt: totalIgst / 100, camt: totalCgst / 100, samt: totalSgst / 100, csamt: 0 } },
    };
    const blob = new Blob([JSON.stringify(gstr3b, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `GSTR3B_${fromDate}_${toDate}.json`; a.click();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="border-b border-[#1e1d24] pb-4 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">GST Reports</h1>
          <p className="text-[#8a8695] text-sm mt-0.5">Generate GSTR-1 &amp; GSTR-3B JSON for filing</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={downloadGSTR1} className="bg-green-600 hover:bg-green-500 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-2">
            ⬇ GSTR-1 JSON
          </button>
          <button onClick={downloadGSTR3B} className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-2">
            ⬇ GSTR-3B JSON
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="flex gap-2 items-center bg-[#1a1920] border border-[#2a2836] rounded-xl px-4 py-2">
          <span className="text-xs text-[#8a8695]">From</span>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="bg-transparent text-white text-sm focus:outline-none" />
          <span className="text-xs text-[#8a8695]">To</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="bg-transparent text-white text-sm focus:outline-none" />
        </div>
        <button onClick={() => router.push(`/gst-reports?from=${from}&to=${to}`)}
          className="bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold px-4 py-2 rounded-xl transition-colors">
          Apply
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Turnover', value: `₹${paise(totalTurnover)}`, color: 'blue' },
          { label: 'Total CGST', value: `₹${paise(totalCgst)}`, color: 'green' },
          { label: 'Total SGST', value: `₹${paise(totalSgst)}`, color: 'amber' },
          { label: 'Total IGST', value: `₹${paise(totalIgst)}`, color: 'purple' },
        ].map(c => (
          <div key={c.label} className="bg-[#1a1920] border border-[#2a2836] rounded-2xl p-4">
            <div className="text-[9px] font-bold text-[#8a8695] uppercase tracking-widest mb-2">{c.label}</div>
            <div className="text-xl font-black text-white">{c.value}</div>
          </div>
        ))}
      </div>

      {/* GST Rate Breakdown */}
      <div className="bg-[#1a1920] border border-[#2a2836] rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">GST Rate-Wise Summary (GSTR-3B Table 3.1)</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[#8a8695] uppercase tracking-wider pb-2">
              <th className="pb-3">Rate</th>
              <th className="pb-3 text-right">Taxable</th>
              <th className="pb-3 text-right">CGST</th>
              <th className="pb-3 text-right">SGST</th>
              <th className="pb-3 text-right">IGST</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a2836]">
            {summaryByRate.map(r => (
              <tr key={r.gstRate} className="text-white">
                <td className="py-3 text-amber-400 font-bold">{r.gstRate}%</td>
                <td className="py-3 text-right">₹{paise(r.taxableAmount)}</td>
                <td className="py-3 text-right text-green-400">₹{paise(r.totalCgst)}</td>
                <td className="py-3 text-right text-amber-400">₹{paise(r.totalSgst)}</td>
                <td className="py-3 text-right text-purple-400">₹{paise(r.totalIgst)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-[#2a2836] font-bold">
              <td className="pt-3 text-white">Total</td>
              <td className="pt-3 text-right text-white">₹{paise(totalTurnover - totalTax)}</td>
              <td className="pt-3 text-right text-green-400">₹{paise(totalCgst)}</td>
              <td className="pt-3 text-right text-amber-400">₹{paise(totalSgst)}</td>
              <td className="pt-3 text-right text-purple-400">₹{paise(totalIgst)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Invoice List */}
      <div className="bg-[#1a1920] border border-[#2a2836] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-[#2a2836]">
          <h3 className="text-sm font-semibold text-white">Invoice-wise Detail ({sales.length} invoices)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-black/20">
              <tr className="text-left text-[#8a8695] uppercase tracking-wider">
                {['Invoice #', 'Date', 'Customer', 'GSTIN', 'Amount', 'CGST', 'SGST', 'IGST'].map(h => (
                  <th key={h} className="px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2836]">
              {sales.map(s => (
                <tr key={s.id} className="text-white hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3 font-mono text-amber-400">{s.invoiceNumber}</td>
                  <td className="px-4 py-3 text-[#8a8695]">{s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                  <td className="px-4 py-3">{s.customerName || 'Walk-in'}</td>
                  <td className="px-4 py-3 font-mono text-[#8a8695]">{s.customerGstin || '—'}</td>
                  <td className="px-4 py-3 font-semibold">₹{paise(s.grandTotalPaise)}</td>
                  <td className="px-4 py-3 text-green-400">₹{paise(s.cgstPaise)}</td>
                  <td className="px-4 py-3 text-amber-400">₹{paise(s.sgstPaise)}</td>
                  <td className="px-4 py-3 text-purple-400">₹{paise(s.igstPaise)}</td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-[#5a5668]">No invoices in this period</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
