
import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';
import { Scale, Printer } from 'lucide-react';

import LedgerVoucherModal from './LedgerVoucherModal';

const BalanceSheet = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // Drill-down State
    const [selectedLedger, setSelectedLedger] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                setLoading(true);
                const { data } = await api.get(`/reports/balance-sheet?date=${date}`);
                setData(data);
                setLoading(false);
            } catch (error) {
                console.error(error);
                toast.error('Failed to load Balance Sheet');
                setLoading(false);
            }
        };

        fetchReport();
    }, [date]);

    const handleRowClick = (item) => {
        if (item._id) {
            setSelectedLedger({ id: item._id, name: item.name });
            setIsModalOpen(true);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Balance Sheet...</div>;

    return (
        <div className="p-8 bg-gray-50 dark:bg-black min-h-screen">
            <div className="max-w-6xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Scale className="text-brand-600" />
                            Balance Sheet
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">As on {new Date(date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-4">
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="bg-gray-100 dark:bg-gray-800 border-none rounded-lg px-4 py-2 text-sm"
                        />
                        <button onClick={() => window.print()} className="flex items-center gap-2 text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white transition">
                            <Printer size={18} /> Print
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-gray-300 dark:border-gray-700">
                    {/* Left Side: Liabilities */}
                    <div className="border-r border-gray-300 dark:border-gray-700 p-0">
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 text-center font-bold text-gray-700 dark:text-gray-300 uppercase text-sm border-b border-gray-300 dark:border-gray-700">
                            Liabilities
                        </div>
                        <div className="p-4 space-y-2 min-h-[300px]">
                            {data?.liabilities.map((item, index) => (
                                <div
                                    key={index}
                                    onClick={() => handleRowClick(item)}
                                    className={`flex justify-between text-sm py-1 border-b border-dashed border-gray-200 dark:border-gray-800 last:border-0 transition-colors ${item._id ? 'hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer' : ''}`}
                                >
                                    <span className={`text-gray-800 dark:text-gray-200 ${item.name === 'Profit & Loss A/c' ? 'font-bold text-green-600' : ''}`}>
                                        {item.name}
                                        {item.name !== 'Profit & Loss A/c' && <span className="text-xs text-gray-400 ml-1">({item.group})</span>}
                                    </span>
                                    <span className="font-mono text-gray-700 dark:text-gray-300">{item.amount.toLocaleString('en-IN')}</span>
                                </div>
                            ))}
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 flex justify-between font-bold text-gray-900 dark:text-white border-t border-gray-300 dark:border-gray-700">
                            <span>Total</span>
                            <span className="font-mono">{data.totalLiabilities.toLocaleString('en-IN')}</span>
                        </div>
                    </div>

                    {/* Right Side: Assets */}
                    <div className="p-0">
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 text-center font-bold text-gray-700 dark:text-gray-300 uppercase text-sm border-b border-gray-300 dark:border-gray-700">
                            Assets
                        </div>
                        <div className="p-4 space-y-2 min-h-[300px]">
                            {data?.assets.map((item, index) => (
                                <div
                                    key={index}
                                    onClick={() => handleRowClick(item)}
                                    className="flex justify-between text-sm py-1 border-b border-dashed border-gray-200 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                                >
                                    <span className="text-gray-800 dark:text-gray-200">{item.name} <span className="text-xs text-gray-400">({item.group})</span></span>
                                    <span className="font-mono text-gray-700 dark:text-gray-300">{item.amount.toLocaleString('en-IN')}</span>
                                </div>
                            ))}
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 flex justify-between font-bold text-gray-900 dark:text-white border-t border-gray-300 dark:border-gray-700">
                            <span>Total</span>
                            <span className="font-mono">{data.totalAssets.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </div>

                {data?.diff !== 0 && (
                    <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-center font-bold border border-red-200 dark:border-red-800">
                        ⚠️ Difference in Books: {data?.diff?.toLocaleString('en-IN')}
                    </div>
                )}
            </div>

            {/* Drill-down Modal */}
            <LedgerVoucherModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                ledgerId={selectedLedger?.id}
                ledgerName={selectedLedger?.name}
                dateRange={{ date }}
            />
        </div>
    );
};

export default BalanceSheet;
