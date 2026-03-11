'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

interface NavItem {
  icon: string;
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { icon: '▣', label: 'Dashboard', href: '/' },
  { icon: '📖', label: 'Daybook', href: '/daybook' },
  { icon: '📄', label: 'New Invoice', href: '/invoice/new' },
  { icon: '📋', label: 'Invoice History', href: '/invoices' },
  { icon: '👥', label: 'Customers', href: '/customers' },
  { icon: '📦', label: 'Suppliers', href: '/suppliers' },
  { icon: '₹', label: 'Expenses', href: '/expenses' },
  { icon: '🏪', label: 'Inventory', href: '/inventory' },
  { icon: '📑', label: 'Letterheads', href: '/letterheads' },
  { icon: '🏦', label: 'Cash & Bank', href: '/cash-bank' },
  { icon: '🗑️', label: 'Recycle Bin', href: '/recycle-bin' },
  { icon: '⚙️', label: 'Settings', href: '/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isDark, setIsDark] = useState(true);
  const [clientView, setClientView] = useState(false);

  const userName = session?.user?.name ?? 'Admin';
  const userRole = (session?.user as { role?: string })?.role ?? 'admin';
  const initial = userName.charAt(0).toUpperCase();

  return (
    <aside className="sidebar w-[185px] min-h-screen bg-[#111014] flex flex-col border-r border-[#1e1d24] shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-[#1e1d24]">
        <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-black text-sm shadow-lg shadow-amber-500/20">
          {initial}
        </div>
        <div className="overflow-hidden">
          <div className="text-white font-semibold text-sm leading-tight truncate">{userName}</div>
          <div className="text-amber-500 text-[9px] font-semibold uppercase tracking-widest">Inventory &amp; Billing</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl text-sm transition-all duration-150 group ${
                isActive
                  ? 'bg-amber-500/15 text-amber-400 font-semibold'
                  : 'text-[#8a8695] hover:text-white hover:bg-white/5'
              }`}
            >
              <span className={`text-base w-5 text-center ${isActive ? 'text-amber-400' : 'text-[#5a5668] group-hover:text-white'}`}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Controls */}
      <div className="border-t border-[#1e1d24] p-2 space-y-1.5 pb-3">
        {/* Theme */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#1a1920]">
          <div className="flex items-center gap-2 text-[#8a8695] text-xs">
            <span>{isDark ? '🌙' : '☀️'}</span>
            <span className="font-medium">Theme</span>
          </div>
          <button
            onClick={() => setIsDark(v => !v)}
            className="text-amber-400 text-[10px] font-bold tracking-wider"
          >
            {isDark ? 'DARK' : 'LIGHT'}
          </button>
        </div>

        {/* Client View */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#1a1920]">
          <div className="flex items-center gap-2 text-[#8a8695] text-xs">
            <span>👁️</span>
            <span className="font-medium">Client View</span>
          </div>
          <button
            onClick={() => setClientView(v => !v)}
            className={`w-9 h-5 rounded-full transition-all duration-200 relative ${clientView ? 'bg-amber-500' : 'bg-[#2e2b38]'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${clientView ? 'left-4' : 'left-0.5'}`} />
          </button>
        </div>

        {/* User + Logout */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1a1920]">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black text-xs font-black shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-semibold truncate">{userName}</div>
            <div className="text-[#5a5668] text-[9px] uppercase tracking-wider">{userRole}</div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            title="Sign Out"
            className="w-6 h-6 flex items-center justify-center text-[#5a5668] hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/10"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
