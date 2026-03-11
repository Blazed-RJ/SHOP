'use client';

import { useState, useTransition } from 'react';
import { createSale, SaleLineItem } from '@/actions/sales';

// ─── Mock Data (replace with DB queries later) ────────────────────────────────
const MOCK_ITEMS = [
  { id: 1, name: 'Paracetamol 500mg', sku: 'PARA-500', gstRate: 12, sellingPricePaise: 5000, batchId: 1, unit: 'strip' },
  { id: 2, name: '22K Gold Chain (10g)', sku: 'GOLD-22K-10G', gstRate: 3, sellingPricePaise: 7500000, batchId: 2, unit: 'pcs' },
];

const CASHIER_ID = 1; // Replace with session user ID after auth

function formatRupees(paise: number) {
  return `₹${(paise / 100).toFixed(2)}`;
}

export default function POSPage() {
  const [cart, setCart] = useState<SaleLineItem[]>([]);
  const [result, setResult] = useState<{ success: boolean; invoiceNumber?: string; grandTotalPaise?: number; error?: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const addToCart = (item: typeof MOCK_ITEMS[0]) => {
    setCart(prev => {
      const existing = prev.find(c => c.inventoryItemId === item.id);
      if (existing) {
        return prev.map(c => c.inventoryItemId === item.id
          ? { ...c, quantity: c.quantity + 1 }
          : c
        );
      }
      return [...prev, {
        inventoryItemId: item.id,
        batchId: item.batchId,
        quantity: 1,
        unit: item.unit,
        priceAtSalePaise: item.sellingPricePaise,
        gstRate: item.gstRate,
      }];
    });
  };

  const removeFromCart = (itemId: number) => {
    setCart(prev => prev.filter(c => c.inventoryItemId !== itemId));
  };

  const subtotal = cart.reduce((sum, c) => sum + c.priceAtSalePaise * c.quantity, 0);
  const totalTax = cart.reduce((sum, c) => {
    const taxable = c.priceAtSalePaise * c.quantity;
    return sum + Math.round(taxable * c.gstRate / 100);
  }, 0);
  const grandTotal = subtotal + totalTax;

  const handleCompleteSale = () => {
    if (cart.length === 0) return;
    startTransition(async () => {
      const res = await createSale({
        lineItems: cart,
        cashierId: CASHIER_ID,
        paymentMethod: 'cash',
      });
      setResult(res);
      if (res.success) setCart([]);
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-sm font-bold">E</div>
          <span className="font-semibold text-lg">ERP — Point of Sale</span>
        </div>
        <span className="text-slate-400 text-sm">Store: Shimla (State: 02)</span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Item Grid */}
        <div className="flex-1 p-6 overflow-y-auto">
          <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-4">Select Items</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {MOCK_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                className="bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all rounded-xl p-4 text-left border border-slate-700 hover:border-blue-500"
              >
                <div className="text-xs text-slate-500 mb-1">{item.sku}</div>
                <div className="font-medium text-sm mb-2 leading-snug">{item.name}</div>
                <div className="text-blue-400 font-bold">{formatRupees(item.sellingPricePaise)}</div>
                <div className="text-xs text-slate-500 mt-1">GST: {item.gstRate}%</div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Cart + Checkout */}
        <div className="w-96 bg-slate-900 border-l border-slate-700 flex flex-col">
          <div className="p-4 border-b border-slate-700">
            <h2 className="font-semibold text-slate-200">Current Sale</h2>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center text-slate-500 py-12">
                <div className="text-4xl mb-2">🛒</div>
                <div className="text-sm">Tap an item to add it</div>
              </div>
            ) : cart.map(item => {
              const meta = MOCK_ITEMS.find(m => m.id === item.inventoryItemId);
              const lineTotal = item.priceAtSalePaise * item.quantity;
              return (
                <div key={item.inventoryItemId} className="flex items-center gap-3 bg-slate-800 rounded-lg p-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{meta?.name}</div>
                    <div className="text-xs text-slate-400">{formatRupees(item.priceAtSalePaise)} × {item.quantity}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-green-400">{formatRupees(lineTotal)}</div>
                    <button onClick={() => removeFromCart(item.inventoryItemId)} className="text-xs text-red-400 hover:text-red-300">Remove</button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Totals */}
          <div className="p-4 border-t border-slate-700 space-y-2">
            <div className="flex justify-between text-sm text-slate-400">
              <span>Subtotal</span><span>{formatRupees(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-400">
              <span>GST (CGST+SGST)</span><span>{formatRupees(totalTax)}</span>
            </div>
            <div className="flex justify-between font-bold text-xl text-white pt-2 border-t border-slate-700">
              <span>Total</span><span className="text-green-400">{formatRupees(grandTotal)}</span>
            </div>

            {result && (
              <div className={`rounded-lg p-3 text-sm mt-2 ${result.success
                ? 'bg-green-900/50 border border-green-600 text-green-300'
                : 'bg-red-900/50 border border-red-600 text-red-300'}`}>
                {result.success
                  ? `✅ Invoice ${result.invoiceNumber} created!`
                  : `❌ ${result.error}`}
              </div>
            )}

            <button
              onClick={handleCompleteSale}
              disabled={cart.length === 0 || isPending}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors mt-2"
            >
              {isPending ? 'Processing...' : `Complete Sale — ${formatRupees(grandTotal)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
