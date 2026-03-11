import { getDailySalesSummary, getLowStockItems, getExpiringBatches } from '@/actions/analytics';
import Link from 'next/link';

function rupees(paise: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(paise / 100);
}

export default async function DashboardPage() {
  const [summary, lowStock, expiring] = await Promise.all([
    getDailySalesSummary(),
    getLowStockItems(),
    getExpiringBatches(30),
  ]);

  const gstTotal = (summary.totalCgstPaise + summary.totalSgstPaise + summary.totalIgstPaise);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top Nav */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">E</div>
            <span className="font-semibold text-lg">ERP Dashboard</span>
            <span className="text-slate-500 text-sm">· Shimla, HP</span>
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/" className="px-4 py-2 text-sm bg-blue-600 rounded-lg font-medium">Dashboard</Link>
            <Link href="/pos" className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">POS</Link>
            <Link href="/inventory" className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">Inventory</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Today's Revenue Cards */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">Today's Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total Revenue"
              value={rupees(summary.totalRevenuePaise)}
              subtext={`${summary.invoiceCount} invoices`}
              color="text-green-400"
              icon="💰"
            />
            <StatCard
              label="CGST Collected"
              value={rupees(summary.totalCgstPaise)}
              subtext="Central GST"
              color="text-blue-400"
              icon="🏛️"
            />
            <StatCard
              label="SGST Collected"
              value={rupees(summary.totalSgstPaise)}
              subtext="State GST"
              color="text-purple-400"
              icon="🏢"
            />
            <StatCard
              label="Total GST"
              value={rupees(gstTotal)}
              subtext="CGST + SGST + IGST"
              color="text-yellow-400"
              icon="📊"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/pos" className="group flex items-center gap-4 bg-gradient-to-r from-blue-900/50 to-blue-800/30 hover:from-blue-800/60 border border-blue-700/50 hover:border-blue-500 rounded-xl p-5 transition-all">
            <div className="w-12 h-12 bg-blue-600/30 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🛒</div>
            <div>
              <div className="font-semibold text-blue-200">New Sale</div>
              <div className="text-sm text-slate-400">Open Point of Sale</div>
            </div>
          </Link>
          <Link href="/inventory" className="group flex items-center gap-4 bg-gradient-to-r from-purple-900/50 to-purple-800/30 hover:from-purple-800/60 border border-purple-700/50 hover:border-purple-500 rounded-xl p-5 transition-all">
            <div className="w-12 h-12 bg-purple-600/30 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📦</div>
            <div>
              <div className="font-semibold text-purple-200">Inventory</div>
              <div className="text-sm text-slate-400">View & manage stock</div>
            </div>
          </Link>
        </div>

        {/* Alerts Row */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Low Stock */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">⚠️</span>
              <h3 className="font-semibold text-sm text-slate-200">Low Stock Alerts</h3>
              {lowStock.length > 0 && (
                <span className="ml-auto bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{lowStock.length}</span>
              )}
            </div>
            {lowStock.length === 0 ? (
              <div className="text-slate-500 text-sm py-4 text-center">✅ All items adequately stocked</div>
            ) : (
              <ul className="space-y-2">
                {lowStock.slice(0, 5).map(item => (
                  <li key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300 truncate">{item.name}</span>
                    <span className="text-orange-400 font-semibold ml-2 shrink-0">{item.currentStock} {item.unit}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Expiring Batches */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🗓️</span>
              <h3 className="font-semibold text-sm text-slate-200">Expiring in 30 Days</h3>
              {expiring.length > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{expiring.length}</span>
              )}
            </div>
            {expiring.length === 0 ? (
              <div className="text-slate-500 text-sm py-4 text-center">✅ No batches expiring soon</div>
            ) : (
              <ul className="space-y-2">
                {expiring.slice(0, 5).map(batch => (
                  <li key={batch.batchId} className="flex items-center justify-between text-sm">
                    <div className="truncate">
                      <span className="text-slate-300">{batch.itemName}</span>
                      <span className="text-slate-500 ml-2 text-xs">{batch.batchNumber}</span>
                    </div>
                    <span className="text-red-400 font-semibold ml-2 shrink-0 text-xs">
                      {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString('en-IN') : '—'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, subtext, color, icon }: {
  label: string; value: string; subtext: string; color: string; icon: string;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{icon}</span>
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-1">{subtext}</div>
    </div>
  );
}
