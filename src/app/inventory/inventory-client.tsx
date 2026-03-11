'use client';

import { useState, useTransition } from 'react';
import { addInventoryBatch } from '@/actions/inventory';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Item {
  id: number;
  name: string;
  sku: string | null;
  category: string | null;
  gstRate: number;
  sellingPricePaise: number;
  basePricePaise: number;
  totalStock: number | null;
  primaryUnit: string | null;
  lowStockThreshold: number | null;
  isActive: boolean | null;
  hsnCode: string | null;
}

interface Batch {
  inventoryItemId: number;
  id: number;
  batchNumber: string;
  quantityPrimary: number | null;
  expiryDate: Date | null;
}

interface Supplier {
  id: number;
  name: string;
}

function rupees(paise: number) {
  return `₹${(paise / 100).toFixed(2)}`;
}

export default function InventoryClient({
  items, batches, suppliers,
}: { items: Item[]; batches: Batch[]; suppliers: Supplier[] }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Item | null>(null);
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const router = useRouter();

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    (i.sku ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (i.category ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const itemBatches = selected ? batches.filter(b => b.inventoryItemId === selected.id) : [];

  const handleAddBatch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selected) return;
    const fd = new FormData(e.currentTarget);
    const batchNumber = fd.get('batchNumber') as string;
    const qty = parseInt(fd.get('qty') as string, 10);
    const costPrice = parseFloat(fd.get('costPrice') as string);
    const supplierId = fd.get('supplierId') ? parseInt(fd.get('supplierId') as string, 10) : null;
    const expiryRaw = fd.get('expiryDate') as string;

    startTransition(async () => {
      const res = await addInventoryBatch({
        inventoryItemId: selected.id,
        batchNumber,
        quantityPrimary: qty,
        costPricePaise: Math.round(costPrice * 100),
        supplierId,
        expiryDate: expiryRaw ? new Date(expiryRaw) : null,
      });
      if (res.success) {
        setMessage({ type: 'ok', text: `Batch #${batchNumber} added (${qty} ${selected.primaryUnit ?? 'pcs'})` });
        setShowAddBatch(false);
        router.refresh();
      } else {
        setMessage({ type: 'err', text: res.error ?? 'Error adding batch' });
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-700 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-sm font-bold hover:bg-blue-500 transition-colors">E</Link>
          <span className="font-semibold">Inventory</span>
          <span className="text-slate-500 text-sm">· {items.length} items</span>
        </div>
        <nav className="flex gap-2">
          <Link href="/" className="text-xs text-slate-400 hover:text-white bg-slate-800 px-3 py-1 rounded-full transition-colors">Dashboard</Link>
          <Link href="/pos" className="text-xs text-slate-400 hover:text-white bg-slate-800 px-3 py-1 rounded-full transition-colors">🛒 POS</Link>
        </nav>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Item List */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-800">
          <div className="p-4 border-b border-slate-800">
            <input
              type="text"
              placeholder="Search by name, SKU, or category..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 border-b border-slate-800 sticky top-0">
                <tr className="text-xs text-slate-500 uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Item</th>
                  <th className="text-left px-4 py-3">Category</th>
                  <th className="text-right px-4 py-3">Stock</th>
                  <th className="text-right px-4 py-3">Price</th>
                  <th className="text-right px-4 py-3">GST</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filtered.map(item => {
                  const isLow = (item.totalStock ?? 0) <= (item.lowStockThreshold ?? 5);
                  const isSelected = selected?.id === item.id;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => { setSelected(item); setShowAddBatch(false); setMessage(null); }}
                      className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-900/30 border-l-2 border-blue-500' : 'hover:bg-slate-800/50'}`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-200">{item.name}</div>
                        {item.sku && <div className="text-xs text-slate-500">{item.sku}</div>}
                      </td>
                      <td className="px-4 py-3 text-slate-400">{item.category ?? '—'}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${isLow ? 'text-orange-400' : 'text-slate-300'}`}>
                        {item.totalStock} <span className="text-xs text-slate-500">{item.primaryUnit}</span>
                        {isLow && <span className="ml-1 text-xs">⚠️</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-300">{rupees(item.sellingPricePaise)}</td>
                      <td className="px-4 py-3 text-right text-slate-400">{item.gstRate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Detail Panel */}
        <div className="w-96 bg-slate-900 flex flex-col overflow-y-auto">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
              <div className="text-center">
                <div className="text-4xl mb-2">👆</div>
                <div>Select an item to view details</div>
              </div>
            </div>
          ) : (
            <div className="p-5 space-y-5">
              {/* Item Header */}
              <div>
                <h2 className="font-bold text-lg text-white">{selected.name}</h2>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {selected.sku && <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-400">{selected.sku}</span>}
                  {selected.hsnCode && <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-400">HSN {selected.hsnCode}</span>}
                  {selected.category && <span className="text-xs bg-blue-900/50 px-2 py-0.5 rounded text-blue-300">{selected.category}</span>}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">Total Stock</div>
                  <div className={`text-xl font-bold ${(selected.totalStock ?? 0) <= (selected.lowStockThreshold ?? 5) ? 'text-orange-400' : 'text-white'}`}>
                    {selected.totalStock} <span className="text-sm font-normal text-slate-400">{selected.primaryUnit}</span>
                  </div>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">Selling Price</div>
                  <div className="text-xl font-bold text-green-400">{rupees(selected.sellingPricePaise)}</div>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">Cost Price</div>
                  <div className="font-semibold text-slate-300">{rupees(selected.basePricePaise)}</div>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">GST Rate</div>
                  <div className="font-semibold text-slate-300">{selected.gstRate}%</div>
                </div>
              </div>

              {/* Batch list */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm text-slate-300">Stock Batches (FEFO)</h3>
                  <button
                    onClick={() => { setShowAddBatch(v => !v); setMessage(null); }}
                    className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-lg transition-colors"
                  >
                    + Add Batch
                  </button>
                </div>

                {itemBatches.length === 0 ? (
                  <div className="text-slate-500 text-sm text-center py-4 bg-slate-800 rounded-lg">No batches registered</div>
                ) : (
                  <div className="space-y-2">
                    {itemBatches.map(b => (
                      <div key={b.id} className="bg-slate-800 rounded-lg px-3 py-2 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-slate-200">{b.batchNumber}</div>
                          <div className="text-xs text-slate-500">
                            Expires: {b.expiryDate ? new Date(b.expiryDate).toLocaleDateString('en-IN') : 'N/A'}
                          </div>
                        </div>
                        <div className={`font-bold text-sm ${(b.quantityPrimary ?? 0) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {b.quantityPrimary} {selected.primaryUnit}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Batch Form */}
              {showAddBatch && (
                <form onSubmit={handleAddBatch} className="space-y-3 bg-slate-800 rounded-xl p-4 border border-blue-700/50">
                  <h4 className="text-sm font-semibold text-blue-300">Add New Batch</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-xs text-slate-400 block mb-1">Batch Number *</label>
                      <input required name="batchNumber" placeholder="e.g. B2024-089" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Quantity *</label>
                      <input required name="qty" type="number" min="1" placeholder="e.g. 100" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Cost Price (₹) *</label>
                      <input required name="costPrice" type="number" step="0.01" min="0" placeholder="e.g. 38.00" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-slate-400 block mb-1">Expiry Date</label>
                      <input name="expiryDate" type="date" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-slate-400 block mb-1">Supplier</label>
                      <select name="supplierId" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                        <option value="">— Select supplier —</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>
                  {message && (
                    <div className={`text-xs p-2 rounded-lg ${message.type === 'ok' ? 'text-green-300 bg-green-900/30' : 'text-red-300 bg-red-900/30'}`}>
                      {message.text}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button type="submit" disabled={isPending} className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white text-sm font-semibold py-2 rounded-lg transition-colors">
                      {isPending ? 'Saving...' : 'Add Batch'}
                    </button>
                    <button type="button" onClick={() => setShowAddBatch(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-700 rounded-lg transition-colors">
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
