'use client';

import { useState, useTransition } from 'react';
import { createSale, SaleLineItem } from '@/actions/sales';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const BarcodeScanner = dynamic(() => import('@/components/ui/BarcodeScanner'), { ssr: false });
const UpiQrModal = dynamic(() => import('@/components/ui/UpiQrModal'), { ssr: false });

interface LiveItem {
  id: number;
  name: string;
  sku: string | null;
  gstRate: number;
  sellingPricePaise: number;
  totalStock: number | null;
  primaryUnit: string | null;
  category: string | null;
  batchId: number | null;
  batchNumber: string | null;
}

function formatRupees(paise: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(paise / 100);
}

const CASHIER_ID = 1;

export default function POSClient({ items, upiId }: { items: LiveItem[]; upiId?: string }) {
  const [cart, setCart] = useState<SaleLineItem[]>([]);
  const [result, setResult] = useState<{ success: boolean; invoiceNumber?: string; grandTotalPaise?: number; error?: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [showUpiQr, setShowUpiQr] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card' | 'credit'>('cash');

  const filteredItems = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    (i.sku ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (item: LiveItem) => {
    if (!item.batchId) return;
    setCart(prev => {
      const existing = prev.find(c => c.inventoryItemId === item.id);
      if (existing) {
        return prev.map(c => c.inventoryItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, {
        inventoryItemId: item.id,
        batchId: item.batchId!,
        quantity: 1,
        unit: item.primaryUnit ?? 'pcs',
        priceAtSalePaise: item.sellingPricePaise,
        gstRate: item.gstRate,
      }];
    });
    setResult(null);
  };

  // Scanner callback — match SKU or name
  const handleScanResult = (value: string) => {
    setShowScanner(false);
    const matched = items.find(i =>
      i.sku?.toLowerCase() === value.toLowerCase() ||
      i.name.toLowerCase() === value.toLowerCase()
    );
    if (matched) {
      addToCart(matched);
      setSearch('');
    } else {
      setSearch(value); // show in search so user can see it
    }
  };

  const removeFromCart = (itemId: number) => setCart(prev => prev.filter(c => c.inventoryItemId !== itemId));

  const updateQty = (itemId: number, qty: number) => {
    if (qty < 1) { removeFromCart(itemId); return; }
    setCart(prev => prev.map(c => c.inventoryItemId === itemId ? { ...c, quantity: qty } : c));
  };

  const subtotal = cart.reduce((s, c) => s + c.priceAtSalePaise * c.quantity, 0);
  const totalTax = cart.reduce((s, c) => s + Math.round(c.priceAtSalePaise * c.quantity * c.gstRate / 100), 0);
  const grandTotal = subtotal + totalTax;

  const handleCompleteSale = () => {
    if (cart.length === 0) return;
    startTransition(async () => {
      const res = await createSale({ lineItems: cart, cashierId: CASHIER_ID, paymentMethod });
      setResult(res);
      if (res.success) {
        setCart([]);
        if (paymentMethod === 'upi') setShowUpiQr(true);
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-700 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-sm font-bold hover:bg-blue-500 transition-colors">E</Link>
          <span className="font-semibold">Point of Sale</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowScanner(true)}
            className="text-xs bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
          >
            📷 Scan Barcode
          </button>
          <Link href="/inventory" className="text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-full transition-colors">📦 Inventory</Link>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Item Grid */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search */}
          <div className="p-4 border-b border-slate-800">
            <input
              type="text"
              placeholder="Search by name or SKU... (or scan a barcode)"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Items Grid */}
          <div className="flex-1 p-4 overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <div className="text-4xl mb-2">📭</div>
                <div className="text-sm">{search ? 'No items match your search' : 'No items in stock'}</div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredItems.map(item => {
                  const inCart = cart.find(c => c.inventoryItemId === item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => addToCart(item)}
                      disabled={!item.batchId}
                      className={`relative text-left rounded-xl p-4 border transition-all active:scale-95 ${
                        inCart
                          ? 'bg-blue-900/50 border-blue-500 ring-1 ring-blue-500/50'
                          : item.batchId
                            ? 'bg-slate-800 border-slate-700 hover:border-blue-400 hover:bg-slate-700'
                            : 'bg-slate-900 border-slate-800 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      {inCart && (
                        <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                          {inCart.quantity}
                        </span>
                      )}
                      {item.category && <div className="text-xs text-slate-500 mb-1 truncate">{item.category}</div>}
                      <div className="text-sm font-medium text-slate-100 leading-snug mb-2 line-clamp-2">{item.name}</div>
                      <div className="text-blue-400 font-bold text-sm">{formatRupees(item.sellingPricePaise)}</div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-slate-500">GST {item.gstRate}%</span>
                        <span className="text-xs text-slate-500">{item.totalStock} {item.primaryUnit}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Cart */}
        <div className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-semibold text-slate-200">Current Sale</h2>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="text-xs text-red-400 hover:text-red-300">Clear all</button>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="text-center text-slate-500 py-16">
                <div className="text-4xl mb-2">🛒</div>
                <div className="text-sm">Tap an item or scan a barcode</div>
              </div>
            ) : cart.map(line => {
              const meta = items.find(i => i.id === line.inventoryItemId);
              const lineTotal = line.priceAtSalePaise * line.quantity;
              const gst = Math.round(lineTotal * line.gstRate / 100);
              return (
                <div key={line.inventoryItemId} className="bg-slate-800 rounded-xl p-3">
                  <div className="flex items-start gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-100 truncate">{meta?.name}</div>
                      <div className="text-xs text-slate-400">{formatRupees(line.priceAtSalePaise)} · GST {line.gstRate}%</div>
                    </div>
                    <button onClick={() => removeFromCart(line.inventoryItemId)} className="text-slate-600 hover:text-red-400 transition-colors text-lg leading-none">×</button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(line.inventoryItemId, line.quantity - 1)} className="w-7 h-7 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-bold transition-colors">−</button>
                      <span className="text-sm font-semibold w-6 text-center">{line.quantity}</span>
                      <button onClick={() => updateQty(line.inventoryItemId, line.quantity + 1)} className="w-7 h-7 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-bold transition-colors">+</button>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-green-400">{formatRupees(lineTotal + gst)}</div>
                      <div className="text-xs text-slate-500">incl. ₹{(gst / 100).toFixed(0)} GST</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Totals + Checkout */}
          <div className="p-4 border-t border-slate-800 space-y-3">
            <div className="flex justify-between text-sm text-slate-400">
              <span>Subtotal</span><span>{formatRupees(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-400">
              <span>CGST + SGST</span><span>{formatRupees(totalTax)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold pt-2 border-t border-slate-700">
              <span>Total</span><span className="text-green-400">{formatRupees(grandTotal)}</span>
            </div>

            {/* Payment Method */}
            <div className="grid grid-cols-4 gap-1.5">
              {(['cash', 'upi', 'card', 'credit'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${paymentMethod === m ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                >
                  {m === 'upi' ? '📱 UPI' : m === 'cash' ? '💵 Cash' : m === 'card' ? '💳 Card' : '📒 Credit'}
                </button>
              ))}
            </div>

            {result && (
              <div className={`rounded-xl p-3 text-sm ${result.success ? 'bg-green-900/40 border border-green-600 text-green-300' : 'bg-red-900/40 border border-red-600 text-red-300'}`}>
                {result.success
                  ? <>✅ Invoice {result.invoiceNumber} — {formatRupees(result.grandTotalPaise ?? 0)}
                    {paymentMethod === 'upi' && (
                      <button onClick={() => setShowUpiQr(true)} className="ml-2 underline text-amber-400 text-xs">Show QR</button>
                    )}
                  </>
                  : `❌ ${result.error}`}
              </div>
            )}

            <button
              onClick={handleCompleteSale}
              disabled={cart.length === 0 || isPending}
              className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors"
            >
              {isPending ? '⏳ Processing...' : `Complete Sale — ${formatRupees(grandTotal)}`}
            </button>
          </div>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <BarcodeScanner
          onDetected={handleScanResult}
          onClose={() => setShowScanner(false)}
          hint="Scan item barcode to add to cart"
        />
      )}

      {/* UPI QR Modal */}
      {showUpiQr && result?.invoiceNumber && (
        <UpiQrModal
          amount={(result.grandTotalPaise ?? grandTotal) / 100}
          invoiceNumber={result.invoiceNumber}
          upiId={upiId}
          onClose={() => setShowUpiQr(false)}
        />
      )}
    </div>
  );
}
