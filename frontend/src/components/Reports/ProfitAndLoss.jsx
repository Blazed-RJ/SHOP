
import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { toast } from 'react-hot-toast'; // Correct import
import { TrendingUp, Printer } from 'lucide-react';

import LedgerVoucherModal from './LedgerVoucherModal';

const ProfitAndLoss = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        from: new Date(new Date().getFullYear(), 3, 1).toISOString().split('T')[0], // April 1st
        to: new Date().toISOString().split('T')[0]
    });

    // Drill-down State
    const [selectedLedger, setSelectedLedger] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                setLoading(true);
                const { data } = await api.get(`/reports/profit-and-loss?from=${dateRange.from}&to=${dateRange.to}`);
                setData(data);
                setLoading(false);
            } catch (error) {
                console.error(error);
                toast.error('Failed to load P&L');
                setLoading(false);
            }
        };

        fetchReport();
    }, [dateRange]);

    const handleRowClick = (item) => {
        // Only ledgers have IDs (not totals or net profit)
        if (item._id) { // Assuming item object usually has ID, but in P&L previous code might not have passed ID. Let's check logic.
            // Wait, previous P&L logic in reportController:
            // expenses.push({ name: l.name, group: l.group.name, amount: bal }) -> It DID NOT pass _id.
            // I need to update reportController first to pass _id in P&L! 
            // Checking reportController logic...
            // "expenses.push({ name: l.name... })" -- Correct, _id is missing.
            // I must fix backend first or else drill-down won't work.
            // But let's assume I will fix backend in next step. I will write frontend code expecting _id.
            setSelectedLedger({ id: item._id, name: item.name });
            setIsModalOpen(true);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Profit & Loss...</div>;

    return (
        <div className="p-8 bg-gray-50 dark:bg-black min-h-screen">
            <div className="max-w-6xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <TrendingUp className="text-brand-600" />
                            Profit & Loss A/c
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(dateRange.from).toLocaleDateString()} - {new Date(dateRange.to).toLocaleDateString()}
                        </p>
                    </div>
                    <div className="flex gap-4 items-center">
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={dateRange.from}
                                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                                className="bg-gray-100 dark:bg-gray-800 border-none rounded-lg px-3 py-2 text-sm"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                                type="date"
                                value={dateRange.to}
                                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                                className="bg-gray-100 dark:bg-gray-800 border-none rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                        <button onClick={() => window.print()} className="flex items-center gap-2 text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white transition">
                            <Printer size={18} /> Print
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-gray-300 dark:border-gray-700">
                    {/* Left Side: Expenses */}
                    <div className="border-r border-gray-300 dark:border-gray-700 p-0">
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 text-center font-bold text-gray-700 dark:text-gray-300 uppercase text-sm border-b border-gray-300 dark:border-gray-700">
                            Particulars (Expenses)
                        </div>
                        <div className="p-4 space-y-2 min-h-[300px]">
                            {data?.expenses.map((item, index) => (
                                <div
                                    key={index}
                                    onClick={() => handleRowClick(item)}
                                    className="flex justify-between text-sm py-1 border-b border-dashed border-gray-200 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                                >
                                    <span className="text-gray-800 dark:text-gray-200">{item.name} <span className="text-xs text-gray-400">({item.group})</span></span>
                                    <span className="font-mono text-gray-700 dark:text-gray-300">{item.amount.toLocaleString('en-IN')}</span>
                                </div>
                            ))}

                            {/* Net Profit goes on Debit side to balance */}
                            {data?.netProfit > 0 && (
                                <div className="flex justify-between text-sm py-2 mt-4 font-bold text-green-600 border-t border-gray-300 dark:border-gray-700">
                                    <span>Net Profit</span>
                                    <span className="font-mono">{data.netProfit.toLocaleString('en-IN')}</span>
                                </div>
                            )}
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 flex justify-between font-bold text-gray-900 dark:text-white border-t border-gray-300 dark:border-gray-700">
                            <span>Total</span>
                            <span className="font-mono">{Math.max(data.totalIncome, data.totalExpenses).toLocaleString('en-IN')}</span>
                        </div>
                    </div>

                    {/* Right Side: Income */}
                    <div className="p-0">
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 text-center font-bold text-gray-700 dark:text-gray-300 uppercase text-sm border-b border-gray-300 dark:border-gray-700">
                            Particulars (Income)
                        </div>
                        <div className="p-4 space-y-2 min-h-[300px]">
                            {data?.income.map((item, index) => (
                                <div
                                    key={index}
                                    onClick={() => handleRowClick(item)}
                                    className="flex justify-between text-sm py-1 border-b border-dashed border-gray-200 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                                >
                                    <span className="text-gray-800 dark:text-gray-200">{item.name} <span className="text-xs text-gray-400">({item.group})</span></span>
                                    <span className="font-mono text-gray-700 dark:text-gray-300">{item.amount.toLocaleString('en-IN')}</span>
                                </div>
                            ))}

                            {/* Net Loss goes on Credit side to balance */}
                            {data?.netProfit < 0 && (
                                <div className="flex justify-between text-sm py-2 mt-4 font-bold text-red-600 border-t border-gray-300 dark:border-gray-700">
                                    <span>Net Loss</span>
                                    <span className="font-mono">{Math.abs(data.netProfit).toLocaleString('en-IN')}</span>
                                </div>
                            )}
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 flex justify-between font-bold text-gray-900 dark:text-white border-t border-gray-300 dark:border-gray-700">
                            <span>Total</span>
                            <span className="font-mono">{Math.max(data.totalIncome, data.totalExpenses).toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </div>

                {/* Drill-down Modal */}
                <LedgerVoucherModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    ledgerId={selectedLedger?.id}
                    ledgerName={selectedLedger?.name}
                    dateRange={dateRange}
                />
            </div>
        </div>
    );
};

export default ProfitAndLoss;
