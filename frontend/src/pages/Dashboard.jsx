import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useClientView } from '../context/ClientViewContext.jsx';
import Layout from '../components/Layout/Layout';
import api from '../utils/api';
import { formatINR } from '../utils/currency';
import LiquidBackground from '../components/UI/LiquidBackground';
import {
    ShoppingCart,
    Package,
    IndianRupee,
    AlertCircle,
    TrendingUp,
    Users,
    FileText,
    Wallet,
    CreditCard,
    History,
    Activity,
    Box,
    Sparkles
} from 'lucide-react';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isClientView } = useClientView();
    const [stats, setStats] = useState({
        totalParties: 0,
        totalItems: 0,
        totalSales: 0,
        totalInvoices: 0,
        cashCollection: 0,
        totalCollections: 0,
        totalReceivables: 0,
        recentInvoices: []
    });
    const [loading, setLoading] = useState(true);
    const [lowStockProducts, setLowStockProducts] = useState([]); // Keep this if it's still used later

    const { recentInvoices } = stats;

    const loadDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            const statsRes = await api.get('/dashboard/stats');
            setStats(statsRes.data);

            setStats(statsRes.data);
            setLowStockProducts(statsRes.data.lowStockProducts || []);

            setLoading(false);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Paid':
                return 'border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10';
            case 'Partial':
                return 'border-amber-500/20 text-amber-600 dark:text-amber-400 bg-amber-500/10';
            case 'Due':
            case 'Overdue':
                return 'border-red-500/20 text-red-600 dark:text-red-400 bg-red-500/10';
            default:
                return 'border-gray-500/20 text-gray-600 dark:text-gray-400 bg-gray-500/10';
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-screen">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="p-8 relative">
                <LiquidBackground />
                {/* Header */}
                <div className="mb-8 relative">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">Dashboard</h1>
                    <p className="text-gray-600 dark:text-brand-300 mt-2 font-light">
                        Welcome back, <span className="font-semibold text-brand-600 dark:text-brand-400">{user?.name}</span>.
                    </p>
                    {/* Decorative Dash */}
                    <div className="w-24 h-1 bg-gradient-to-r from-brand-500 to-transparent mt-4 rounded-full"></div>
                </div>

                {/* Top 4 Stat Cards - Premium Industrial Style */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Parties (Blue) */}
                    <div className="bg-blue-100 dark:bg-gradient-to-br dark:from-blue-950 dark:via-black dark:to-black rounded-2xl p-6 box-outline shadow-sm dark:shadow-[0_0_20px_rgba(59,130,246,0.15)] relative overflow-hidden group transition-all duration-300">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 dark:opacity-20 bg-repeat"></div>
                        <div className="relative z-10 w-full">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-bold text-black dark:text-blue-200 uppercase tracking-widest">Total Parties</p>
                                    <p className="text-3xl lg:text-4xl font-black mt-2 text-black dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-blue-100 dark:via-blue-300 dark:to-blue-500 font-mono">
                                        {stats.totalParties}
                                    </p>
                                </div>
                                <div className="p-3 bg-white/80 dark:bg-blue-500/20 rounded-xl border border-brand-500/20 dark:border-brand-500/10 text-blue-500 dark:text-blue-300 group-hover:text-white group-hover:bg-blue-600 dark:group-hover:bg-blue-500 transition-all duration-300 shadow-sm dark:shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                                    <Users className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="mt-4 h-1 w-full bg-blue-50 dark:bg-blue-900/30 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 w-3/4 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                            </div>
                        </div>
                    </div>

                    {/* Total Items (Green) */}
                    <div className="bg-emerald-100 dark:bg-gradient-to-br dark:from-emerald-950 dark:via-black dark:to-black rounded-2xl p-6 box-outline shadow-sm dark:shadow-[0_0_20px_rgba(16,185,129,0.15)] relative overflow-hidden group transition-all duration-300">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 dark:opacity-20 bg-repeat"></div>
                        <div className="relative z-10 w-full">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-bold text-black dark:text-emerald-200 uppercase tracking-widest">Total Items</p>
                                    <p className="text-3xl lg:text-4xl font-black mt-2 text-black dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-emerald-100 dark:via-emerald-300 dark:to-emerald-500 font-mono">
                                        {stats.totalItems}
                                    </p>
                                </div>
                                <div className="p-3 bg-white/80 dark:bg-emerald-500/20 rounded-xl border border-brand-500/20 dark:border-brand-500/10 text-emerald-500 dark:text-emerald-300 group-hover:text-white group-hover:bg-emerald-600 dark:group-hover:bg-emerald-500 transition-all duration-300 shadow-sm dark:shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                                    <Package className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="mt-4 h-1 w-full bg-emerald-50 dark:bg-emerald-900/30 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-1/2 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                            </div>
                        </div>
                    </div>

                    {/* Total Invoices (Fuchsia) */}
                    <div className="bg-fuchsia-100 dark:bg-gradient-to-br dark:from-fuchsia-950 dark:via-black dark:to-black rounded-2xl p-6 box-outline shadow-sm dark:shadow-[0_0_20px_rgba(217,70,239,0.15)] relative overflow-hidden group transition-all duration-300">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 dark:opacity-20 bg-repeat"></div>
                        <div className="relative z-10 w-full">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-bold text-black dark:text-fuchsia-200 uppercase tracking-widest">Total Invoices</p>
                                    <p className="text-3xl lg:text-4xl font-black mt-2 text-black dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-fuchsia-100 dark:via-fuchsia-300 dark:to-fuchsia-500 font-mono">
                                        {stats.totalInvoices}
                                    </p>
                                </div>
                                <div className="p-3 bg-white/80 dark:bg-fuchsia-500/20 rounded-xl border border-brand-500/20 dark:border-brand-500/10 text-fuchsia-500 dark:text-fuchsia-300 group-hover:text-white group-hover:bg-fuchsia-600 dark:group-hover:bg-fuchsia-500 transition-all duration-300 shadow-sm dark:shadow-[0_0_15px_rgba(217,70,239,0.3)]">
                                    <FileText className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="mt-4 h-1 w-full bg-fuchsia-50 dark:bg-fuchsia-900/30 rounded-full overflow-hidden">
                                <div className="h-full bg-fuchsia-500 w-2/3 rounded-full shadow-[0_0_10px_rgba(217,70,239,0.5)]"></div>
                            </div>
                        </div>
                    </div>

                    {/* Total Sales (Indigo) */}
                    <div className="bg-indigo-100 dark:bg-gradient-to-br dark:from-indigo-950 dark:via-black dark:to-black rounded-2xl p-6 box-outline shadow-sm dark:shadow-[0_0_20px_rgba(99,102,241,0.15)] relative overflow-hidden group transition-all duration-300">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 dark:opacity-20 bg-repeat"></div>
                        <div className="relative z-10">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-bold text-black dark:text-indigo-200 uppercase tracking-widest">Total Sales</p>
                                    <p className="text-3xl lg:text-4xl font-black mt-2 text-black dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-indigo-100 dark:via-indigo-300 dark:to-indigo-500 rupee font-mono">
                                        {formatINR(stats.totalSales)}
                                    </p>
                                </div>
                                <div className="p-3 bg-white/80 dark:bg-indigo-500/20 rounded-xl border border-brand-500/20 dark:border-brand-500/10 text-indigo-500 dark:text-indigo-300 group-hover:text-white group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 transition-all duration-300 shadow-sm dark:shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                            </div>
                            {(() => {
                                const growth = stats.yesterdaySales > 0
                                    ? ((stats.todaySales - stats.yesterdaySales) / stats.yesterdaySales) * 100
                                    : (stats.todaySales > 0 ? 100 : 0);
                                const isPositive = growth >= 0;

                                return (
                                    <div className="mt-6 flex items-center text-xs">
                                        <span className={`${isPositive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'} px-2 py-1 rounded mr-2 font-bold`}>
                                            {isPositive ? '+' : ''}{growth.toFixed(1)}%
                                        </span>
                                        <span className="font-bold uppercase tracking-tight text-indigo-600 dark:text-indigo-400">
                                            {isPositive ? 'Growth vs Yesterday' : 'Decrease vs Yesterday'}
                                        </span>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>

                {/* Today's Collection Breakdown */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                        <span className="w-1 h-6 bg-brand-500 rounded-full mr-3"></span>
                        Today's Overview
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Cash Collection (Green) */}
                        <div className="bg-gradient-to-br from-emerald-200 via-emerald-100 to-white dark:bg-gradient-to-br dark:from-emerald-950 dark:via-black dark:to-black rounded-xl p-5 box-outline shadow-lg shadow-emerald-200/50 dark:shadow-[0_0_15px_rgba(16,185,129,0.15)] relative overflow-hidden group transition-all duration-300">
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 dark:opacity-20 bg-repeat"></div>
                            <div className="relative z-10">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs font-black text-black dark:text-emerald-200 uppercase tracking-wider">Cash In Hand</p>
                                        <p className="text-2xl font-black text-black dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-emerald-100 dark:via-emerald-300 dark:to-emerald-500 mt-1 rupee font-mono">
                                            {formatINR(stats.cashCollection)}
                                        </p>
                                    </div>
                                    <div className="p-2 bg-white/80 dark:bg-emerald-500/20 rounded-lg border border-brand-500/20 dark:border-brand-500/10 text-emerald-500 dark:text-emerald-300 group-hover:text-white group-hover:bg-emerald-600 dark:group-hover:bg-emerald-500 transition-all duration-300 shadow-sm dark:shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                                        <Wallet className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="mt-4 absolute bottom-0 left-0 w-full h-1 bg-emerald-200/30 dark:bg-emerald-500/10">
                                    <div className="h-full bg-emerald-500/50 w-2/3 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                </div>
                            </div>
                        </div>

                        {/* Online (UPI) (Yellow) */}
                        <div className="bg-gradient-to-br from-amber-200 via-amber-100 to-white dark:bg-gradient-to-br dark:from-yellow-950 dark:via-black dark:to-black rounded-xl p-5 box-outline shadow-lg shadow-amber-200/50 dark:shadow-[0_0_15px_rgba(234,179,8,0.15)] relative overflow-hidden group transition-all duration-300">
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 dark:opacity-20 bg-repeat"></div>
                            <div className="relative z-10">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs font-black text-black dark:text-yellow-200 uppercase tracking-wider">Online (UPI)</p>
                                        <p className="text-2xl font-black text-black dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-yellow-100 dark:via-yellow-300 dark:to-yellow-500 mt-1 rupee font-mono">
                                            {formatINR(stats.onlineCollection)}
                                        </p>
                                    </div>
                                    <div className="p-2 bg-white/80 dark:bg-yellow-500/20 rounded-lg border border-brand-500/20 dark:border-brand-500/10 text-amber-600 dark:text-yellow-300 group-hover:text-white group-hover:bg-yellow-500 transition-all duration-300 shadow-sm dark:shadow-[0_0_10px_rgba(234,179,8,0.3)]">
                                        <CreditCard className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="mt-4 absolute bottom-0 left-0 w-full h-1 bg-amber-200/30 dark:bg-yellow-50 dark:bg-yellow-500/10">
                                    <div className="h-full bg-yellow-500/50 w-3/4 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
                                </div>
                            </div>
                        </div>

                        {/* Total Sale (Indigo) */}
                        <div className="bg-gradient-to-br from-indigo-200 via-indigo-100 to-white dark:bg-gradient-to-br dark:from-indigo-950 dark:via-black dark:to-black rounded-xl p-5 box-outline shadow-lg shadow-indigo-200/50 dark:shadow-[0_0_15px_rgba(99,102,241,0.15)] relative overflow-hidden group transition-all duration-300">
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 dark:opacity-20 bg-repeat"></div>
                            <div className="relative z-10">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs font-black text-black dark:text-indigo-200 uppercase tracking-wider">Total Sales Today</p>
                                        <p className="text-2xl font-black text-black dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-indigo-100 dark:via-indigo-300 dark:to-indigo-500 mt-1 rupee font-mono">
                                            {formatINR(stats.todaySales)}
                                        </p>
                                    </div>
                                    <div className="p-2 bg-white/80 dark:bg-indigo-500/20 rounded-lg border border-brand-500/20 dark:border-brand-500/10 text-indigo-500 dark:text-indigo-300 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300 shadow-sm dark:shadow-[0_0_10px_rgba(99,102,241,0.3)]">
                                        <ShoppingCart className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="mt-4 absolute bottom-0 left-0 w-full h-1 bg-indigo-200/30 dark:bg-indigo-50 dark:bg-indigo-500/10">
                                    <div className="h-full bg-indigo-500/50 w-1/2 shadow-[0_0_10px_rgba(99,102,241,0.3)]"></div>
                                </div>
                            </div>
                        </div>

                        {/* Credit (Udhaar) (Red) */}
                        <div className="bg-gradient-to-br from-red-200 via-red-100 to-white dark:bg-gradient-to-br dark:from-red-950 dark:via-black dark:to-black rounded-xl p-5 box-outline shadow-lg shadow-red-200/50 dark:shadow-[0_0_15px_rgba(239,68,68,0.15)] relative overflow-hidden group transition-all duration-300">
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 dark:opacity-20 bg-repeat"></div>
                            <div className="relative z-10">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs font-black text-black dark:text-red-200 uppercase tracking-wider">Pending (Udhaar)</p>
                                        <p className="text-2xl font-black text-black dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-red-100 dark:via-red-300 dark:to-red-500 mt-1 rupee font-mono">
                                            {formatINR(stats.totalReceivables)}
                                        </p>
                                    </div>
                                    <div className="p-2 bg-white/80 dark:bg-red-500/20 rounded-lg border border-brand-500/20 dark:border-brand-500/10 text-red-500 dark:text-red-300 group-hover:text-white group-hover:bg-red-600 dark:group-hover:bg-red-500 transition-all duration-300 shadow-sm dark:shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                                        <AlertCircle className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="mt-4 absolute bottom-0 left-0 w-full h-1 bg-red-200/30 dark:bg-red-50 dark:bg-red-500/10">
                                    <div className="h-full bg-red-500/50 w-4/5 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stock Widgets */}
                {!isClientView && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Stock Value Widget */}
                        <div className="bg-sky-100 dark:bg-gradient-to-br dark:from-sky-950 dark:via-black dark:to-black p-6 rounded-2xl box-outline shadow-sm relative overflow-hidden group transition-all duration-300">
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-sky-500/10 rounded-full blur-3xl"></div>
                            <div className="flex items-center space-x-2">
                                <div className="p-2 bg-sky-500/20 rounded-lg text-sky-600 dark:text-sky-400 group-hover:text-white group-hover:bg-sky-600 dark:group-hover:bg-sky-500 transition-all duration-300 shadow-sm">
                                    <Box className="w-4 h-4" />
                                </div>
                                <h3 className="text-black dark:text-sky-400 text-sm font-bold uppercase tracking-wider relative z-10">Total Stock Value</h3>
                            </div>
                            <div className="mt-4 flex items-baseline relative z-10">
                                <span className="text-4xl font-black text-black dark:text-white rupee font-mono">{formatINR(stats.totalStockValue)}</span>
                                <span className="ml-2 text-sm text-sky-900 dark:text-sky-400 font-medium opacity-60">asset value</span>
                            </div>
                            {/* Progress Bar (Visual only) */}
                            <div className="mt-6 flex space-x-1">
                                {[...Array(10)].map((_, i) => (
                                    <div key={i} className={`h-2 flex-1 rounded-full ${i < 7 ? 'bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.4)]' : 'bg-sky-200/30 dark:bg-white/5'}`}></div>
                                ))}
                            </div>
                        </div>

                        {/* Profit Widget */}
                        <div className="bg-emerald-100 dark:bg-gradient-to-br dark:from-emerald-950 dark:via-black dark:to-black p-6 rounded-2xl box-outline shadow-sm relative overflow-hidden group transition-all duration-300">
                            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl"></div>
                            <div className="flex items-center space-x-2">
                                <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400 group-hover:text-white group-hover:bg-emerald-600 dark:group-hover:bg-emerald-500 transition-all duration-300 shadow-sm">
                                    <Sparkles className="w-4 h-4" />
                                </div>
                                <h3 className="text-black dark:text-emerald-400 text-sm font-bold uppercase tracking-wider relative z-10">Projected Profit</h3>
                            </div>
                            <div className="mt-4 flex items-baseline relative z-10">
                                <span className="text-4xl font-black text-black dark:text-white rupee font-mono">{formatINR(stats.potentialProfit)}</span>
                                <span className="ml-2 text-sm text-emerald-900 dark:text-emerald-400 font-medium opacity-60">gross margin</span>
                            </div>
                            {/* Glow Line */}
                            {(() => {
                                const profitEfficiency = stats.totalSales > 0
                                    ? Math.round((stats.potentialProfit / stats.totalSales) * 100)
                                    : 0;

                                return (
                                    <>
                                        <div className="mt-6 flex items-center justify-between text-xs">
                                            <span className="text-emerald-800/60 dark:text-gray-400 uppercase tracking-tighter font-bold">Profit Efficiency</span>
                                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{profitEfficiency}%</span>
                                        </div>
                                        <div className="mt-2 h-1 bg-emerald-200/30 dark:bg-emerald-900/30 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${Math.min(profitEfficiency, 100)}%` }}></div>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                )}

                {/* Recent Invoices and Low Stock Items */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Invoices */}
                    <div className="bg-violet-100 dark:bg-gray-900 rounded-2xl box-outline shadow-sm overflow-hidden transition-all duration-300">
                        <div className="p-6 border-b-[2.5px] border-black dark:border-white/90 flex items-center justify-between bg-violet-200/50 dark:bg-violet-950/10">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-violet-500/10 rounded-lg">
                                    <TrendingUp className="w-5 h-5 text-violet-500" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Live Transactions</h2>
                            </div>
                            <button
                                onClick={() => navigate('/invoices')}
                                className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-violet-500 uppercase tracking-widest border border-violet-500/20 px-4 py-2 rounded-lg hover:bg-violet-500/10 transition-all duration-300"
                            >
                                View All
                            </button>
                        </div>
                        <div className="p-4">
                            {recentInvoices.length === 0 ? (
                                <div className="text-center py-20 text-gray-400 dark:text-gray-500 relative group">
                                    <div className="relative inline-block mb-6">
                                        <div className="absolute inset-0 bg-violet-500/20 blur-2xl rounded-full scale-150 group-hover:bg-violet-500/30 transition-all duration-700"></div>
                                        <div className="relative z-10 w-24 h-24 bg-white dark:bg-violet-950/20 rounded-full flex items-center justify-center border border-violet-100 dark:border-violet-500/20 shadow-lg group-hover:scale-110 transition-transform duration-500">
                                            <History className="w-12 h-12 text-violet-500/40 group-hover:text-violet-500 transition-colors duration-500" />
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">System Ready</h3>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] mt-2">Waiting for new transactions</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {recentInvoices.map((invoice) => (
                                        <div
                                            key={invoice._id}
                                            className="flex items-center justify-between p-4 bg-white/60 dark:bg-white/5 hover:bg-white dark:hover:bg-violet-500/5 rounded-xl transition-all duration-300 cursor-pointer border border-violet-200/50 hover:border-violet-500/50 hover:shadow-md group"
                                            onClick={() => navigate(`/invoices`)}
                                        >
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-white/5 border border-violet-200 dark:border-brand-500/30 flex items-center justify-center text-violet-400 group-hover:text-violet-600 transition-colors shadow-sm">
                                                    <FileText className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-black dark:text-white font-mono text-sm tracking-tight">{invoice.invoiceNo}</p>
                                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                                        {invoice.customer?.name || 'Walk-in Customer'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-black dark:text-white rupee text-base font-mono tracking-tighter">
                                                    {formatINR(invoice.grandTotal)}
                                                </p>
                                                <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(invoice.status)}`}>
                                                    {invoice.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Low Stock Items */}
                    <div className="bg-red-100 dark:bg-gray-900 rounded-2xl box-outline shadow-sm overflow-hidden transition-all duration-300">
                        <div className="p-6 border-b-[2.5px] border-black dark:border-white/90 flex items-center justify-between bg-red-200/50 dark:bg-red-950/20">
                            <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-lg ${lowStockProducts.length > 0 ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-emerald-500/20 text-emerald-500'}`}>
                                    <AlertCircle className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Stock Alerts</h2>
                            </div>
                            {lowStockProducts.length > 0 && (
                                <span className="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-full animate-bounce">
                                    {lowStockProducts.length} CRITICAL
                                </span>
                            )}
                        </div>
                        <div className="p-4">
                            {lowStockProducts.length === 0 ? (
                                <div className="py-12 bg-red-50/50 dark:bg-red-950/10 rounded-xl border border-red-200 dark:border-brand-500/70 flex flex-col items-center justify-center relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                    <div className="relative z-10 w-20 h-20 bg-white dark:bg-red-500/20 rounded-full flex items-center justify-center shadow-lg border border-red-100 dark:border-red-500/30 mb-4 transition-transform duration-500 group-hover:scale-110">
                                        <Package className="w-10 h-10 text-red-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-red-700 dark:text-red-400 tracking-tight relative z-10">All Systems Optimal</h3>
                                    <p className="text-red-600/60 dark:text-red-400/40 text-xs mt-1 font-medium uppercase tracking-widest relative z-10">Inventory secure</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {lowStockProducts.map((product) => (
                                        <div
                                            key={product._id}
                                            className="flex items-center justify-between p-4 bg-white/60 dark:bg-red-900/10 hover:bg-white dark:hover:bg-red-900/20 rounded-xl border border-red-200 hover:border-red-500/50 transition-all duration-300 group"
                                        >
                                            <div className="flex items-center space-x-4">
                                                {product.image ? (
                                                    <img
                                                        src={product.image}
                                                        alt={product.name}
                                                        className="w-12 h-12 rounded-xl bg-gray-900 object-cover shadow-sm group-hover:scale-110 transition-transform duration-300"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-white/10 flex items-center justify-center shadow-sm">
                                                        <Package className="w-6 h-6 text-red-500/50" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-black text-black dark:text-white text-sm tracking-tight">{product.name}</p>
                                                    <p className="text-[10px] font-bold text-red-500/60 dark:text-red-400/40 uppercase tracking-widest">{product.category}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-black text-red-700 dark:text-red-500 font-mono tracking-tighter">
                                                    {product.stock}
                                                </p>
                                                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter">remaining</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Dashboard;
