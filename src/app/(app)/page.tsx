import { getDailySalesSummary, getLowStockItems, getExpiringBatches } from '@/actions/analytics';

function rupees(paise: number) {
  return `₹ ${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

export default async function DashboardPage() {
  const [summary, lowStock, expiring] = await Promise.all([
    getDailySalesSummary(),
    getLowStockItems(),
    getExpiringBatches(30),
  ]);

  const totalGst = summary.totalCgstPaise + summary.totalSgstPaise + summary.totalIgstPaise;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-[#1e1d24] pb-4">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-[#8a8695] text-sm mt-0.5">
          Welcome back, <span className="text-amber-400 font-semibold">Blazed ERP</span>.
        </p>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="TOTAL INVOICES"
          value={String(summary.invoiceCount)}
          icon="📄"
          color="purple"
          trend={null}
        />
        <MetricCard
          title="TOTAL SALES"
          value={rupees(summary.totalRevenuePaise)}
          icon="↗"
          color="blue"
          trend="+0.0%"
          trendLabel="GROWTH VS YESTERDAY"
        />
        <MetricCard
          title="CGST COLLECTED"
          value={rupees(summary.totalCgstPaise)}
          icon="🏛️"
          color="green"
          trend={null}
        />
        <MetricCard
          title="SGST COLLECTED"
          value={rupees(summary.totalSgstPaise)}
          icon="🏢"
          color="amber"
          trend={null}
        />
      </div>

      {/* Today's Overview */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 bg-amber-400 rounded-full" />
          <h2 className="text-sm font-semibold text-white">Today's Overview</h2>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <OverviewCard label="CASH IN HAND" value="₹ 0.00" icon="💵" color="emerald" />
          <OverviewCard label="ONLINE (UPI)" value="₹ 0.00" icon="📱" color="yellow" />
          <OverviewCard label="TOTAL SALES TODAY" value={rupees(summary.totalRevenuePaise)} icon="🛒" color="blue" />
          <div className="bg-[#1a1920] border border-[#2a2836] rounded-2xl p-4">
            <div className="text-[9px] font-semibold uppercase tracking-widest text-amber-500 mb-2">PENDING (UDHAAR)</div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[#8a8695]">To Take</span>
                <span className="text-green-400 font-bold">₹ 0.00</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#8a8695]">To Give</span>
                <span className="text-red-400 font-bold">₹ 0.00</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Value + Live Transactions + Alerts */}
      <div className="grid grid-cols-2 gap-4">
        {/* Live Transactions */}
        <div className="bg-[#1a1920] border border-[#2a2836] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-amber-400">↗</span>
              <h3 className="text-sm font-semibold text-white">Live Transactions</h3>
            </div>
            <a href="/invoices" className="text-xs text-amber-400 hover:underline">VIEW ALL</a>
          </div>
          {summary.invoiceCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-full bg-[#2a2836] flex items-center justify-center text-2xl mb-3">🔄</div>
              <div className="text-sm font-medium text-[#8a8695]">System Ready</div>
              <div className="text-xs text-[#5a5668] mt-1">WAITING FOR NEW TRANSACTIONS</div>
            </div>
          ) : (
            <div className="text-sm text-slate-300">{summary.invoiceCount} invoice(s) today</div>
          )}
        </div>

        {/* Stock Alerts */}
        <div className="bg-[#1a1920] border border-[#2a2836] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-red-400">⚠</span>
              <h3 className="text-sm font-semibold text-white">Stock Alerts</h3>
            </div>
            {lowStock.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {lowStock.length} CRITICAL
              </span>
            )}
          </div>
          {lowStock.length === 0 && expiring.length === 0 ? (
            <div className="text-center py-10 text-[#5a5668] text-sm">✅ All items adequately stocked</div>
          ) : (
            <ul className="space-y-2">
              {lowStock.slice(0, 6).map(item => (
                <li key={item.id} className="flex items-center gap-3 bg-[#21202a] rounded-xl px-3 py-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#2a2836] flex items-center justify-center text-sm">📦</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{item.name}</div>
                    <div className="text-[10px] text-[#5a5668] uppercase tracking-wide">{item.currentStock} remaining</div>
                  </div>
                  <span className="text-orange-400 font-bold text-sm">{item.currentStock}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, color, trend, trendLabel }: {
  title: string; value: string; icon: string;
  color: 'blue' | 'green' | 'purple' | 'amber';
  trend: string | null; trendLabel?: string;
}) {
  const colors = {
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    green: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  };
  return (
    <div className={`border rounded-2xl p-5 ${colors[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[9px] font-semibold uppercase tracking-widest opacity-70">{title}</div>
        <div className="w-8 h-8 rounded-xl bg-current/10 flex items-center justify-center text-sm opacity-80">{icon}</div>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {trend && (
        <div className="mt-2 flex items-center gap-1">
          <span className="text-xs font-bold">{trend}</span>
          {trendLabel && <span className="text-[9px] opacity-60">{trendLabel}</span>}
        </div>
      )}
      <div className={`h-0.5 mt-3 rounded-full bg-current opacity-30`} />
    </div>
  );
}

function OverviewCard({ label, value, icon, color }: {
  label: string; value: string; icon: string;
  color: 'emerald' | 'yellow' | 'blue';
}) {
  const colors = {
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    yellow: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  };
  return (
    <div className={`border rounded-2xl p-4 ${colors[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[9px] font-semibold uppercase tracking-widest opacity-70">{label}</div>
        <div className="w-7 h-7 rounded-lg bg-current/10 flex items-center justify-center text-xs">{icon}</div>
      </div>
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="h-0.5 mt-2 rounded-full bg-current opacity-20" />
    </div>
  );
}
