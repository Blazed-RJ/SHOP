
import React, { useState, useEffect } from 'react';
import { Wallet, Building2, Package, RefreshCcw, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import api from '../utils/api';

import MoneyAdjustmentModal from './MoneyAdjustmentModal';

const DashboardStats = () => {
    const [stats, setStats] = useState({
        cashInHand: 0,
        cashInBank: 0,
        productValue: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showMoneyModal, setShowMoneyModal] = useState(false);

    const fetchStats = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/reports/dashboard-summary');
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const formatCurrency = (amount) => {
        const value = Number(amount) || 0;
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(value);
    };

    const StatCard = ({ title, value, icon: Icon, colorClass, borderClass, bgClass, showAddButton }) => (
        <div className={`relative overflow-hidden rounded-2xl border ${borderClass} ${bgClass} p-6 transition-all duration-300 hover:shadow-lg group`}>
            {/* Background Icon */}
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Icon size={64} />
            </div>

            {/* Content */}
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${colorClass} bg-white/90 shadow-sm`}>
                            <Icon size={24} />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
                    </div>
                    {showAddButton && (
                        <button
                            onClick={() => setShowMoneyModal(true)}
                            className="flex items-center gap-2 bg-white/80 hover:bg-white text-gray-700 hover:text-green-600 px-3 py-1.5 rounded-lg shadow-sm border border-gray-100 transition-all transform hover:scale-105"
                            title="Add/Withdraw Money"
                        >
                            <ArrowUpRight className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase">Add Money</span>
                        </button>
                    )}
                </div>

                <div className="flex items-end gap-2">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {loading ? (
                            <div className="h-9 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                        ) : error ? (
                            <span className="text-sm text-red-500">Error loading data</span>
                        ) : (
                            formatCurrency(value)
                        )}
                    </h2>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* TEMP DEBUG DISPLAY */}
            <div className="bg-black text-green-400 p-2 text-xs font-mono mb-4 rounded overflow-auto hidden">
                JSON Data: {JSON.stringify(stats)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard
                    title="Cash In Hand"
                    value={stats.cashInHand}
                    icon={Wallet}
                    colorClass="text-emerald-600"
                    borderClass="border-emerald-100 dark:border-emerald-900/30"
                    bgClass="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/10 dark:to-gray-900"
                    showAddButton={true}
                />

                <StatCard
                    title="Cash In Bank"
                    value={stats.cashInBank}
                    icon={Building2}
                    colorClass="text-blue-600"
                    borderClass="border-blue-100 dark:border-blue-900/30"
                    bgClass="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/10 dark:to-gray-900"
                    showAddButton={true}
                />

                <StatCard
                    title="Total Stock Value"
                    value={stats.productValue}
                    icon={Package}
                    colorClass="text-violet-600"
                    borderClass="border-violet-100 dark:border-violet-900/30"
                    bgClass="bg-gradient-to-br from-violet-50 to-white dark:from-violet-900/10 dark:to-gray-900"
                />
            </div>

            <MoneyAdjustmentModal
                isOpen={showMoneyModal}
                onClose={() => setShowMoneyModal(false)}
                onSuccess={fetchStats}
            />
        </>
    );
};

export default DashboardStats;
