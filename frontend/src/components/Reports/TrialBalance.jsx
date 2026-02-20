
import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';
import { FileText, Printer } from 'lucide-react';

import LedgerVoucherModal from './LedgerVoucherModal';

const TrialBalance = () => {
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
                const { data } = await api.get(`/reports/trial-balance?date=${date}`);
                setData(data);
                setLoading(false);
            } catch (error) {
                console.error(error);
                toast.error('Failed to load Trial Balance');
                setLoading(false);
            }
        };

        fetchReport();
    }, [date]);

    const handleRowClick = (item) => {
        setSelectedLedger({ id: item._id, name: item.name });
        setIsModalOpen(true);
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Trial Balance...</div>;

    return (
        <div className="p-8 bg-gray-50 dark:bg-black min-h-screen">
            <div className="max-w-5xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <FileText className="text-brand-600" />
                            Trial Balance
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

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase font-bold text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-3 rounded-l-lg">Particulars</th>
                                <th className="px-6 py-3 text-right text-green-600">Debit</th>
                                <th className="px-6 py-3 rounded-r-lg text-right text-red-600">Credit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {data?.entries.map((item) => (
                                <tr
                                    key={item._id}
                                    onClick={() => handleRowClick(item)}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                                >
                                    <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">
                                        {item.name}
                                        <span className="ml-2 text-xs text-gray-400 font-normal">({item.groupName})</span>
                                    </td>
                                    <td className="px-6 py-3 text-right font-mono text-gray-700 dark:text-gray-300">
                                        {item.debit > 0 ? item.debit.toLocaleString('en-IN') : ''}
                                    </td>
                                    <td className="px-6 py-3 text-right font-mono text-gray-700 dark:text-gray-300">
                                        {item.credit > 0 ? item.credit.toLocaleString('en-IN') : ''}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-100 dark:bg-gray-800 font-bold text-gray-900 dark:text-white border-t-2 border-gray-300 dark:border-gray-600">
                            <tr>
                                <td className="px-6 py-4 text-right transform -translate-x-4">Total</td>
                                <td className="px-6 py-4 text-right font-mono text-green-700 dark:text-green-400">
                                    {data?.totalDebit?.toLocaleString('en-IN')}
                                </td>
                                <td className="px-6 py-4 text-right font-mono text-red-700 dark:text-red-400">
                                    {data?.totalCredit?.toLocaleString('en-IN')}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
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
                dateRange={{ date }} // Pass single date as current "As of"
            />
        </div>
    );
};

export default TrialBalance;
