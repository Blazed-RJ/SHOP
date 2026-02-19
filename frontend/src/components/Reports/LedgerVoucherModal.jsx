import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Printer } from 'lucide-react';

const LedgerVoucherModal = ({ isOpen, onClose, ledgerId, ledgerName, dateRange }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && ledgerId) {
            fetchVouchers();
        } else {
            setData(null);
        }
    }, [isOpen, ledgerId, dateRange]);

    const fetchVouchers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const from = dateRange?.from || dateRange?.date || new Date().toISOString().split('T')[0];
            const to = dateRange?.to || dateRange?.date || new Date().toISOString().split('T')[0];

            const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/reports/ledger-vouchers?ledgerId=${ledgerId}&from=${from}&to=${to}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{ledgerName}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Ledger Vouchers • {dateRange?.from || dateRange?.date} to {dateRange?.to || dateRange?.date}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="text-center py-10 text-gray-500">Loading transactions...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase font-bold text-gray-500 dark:text-gray-400 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Voucher</th>
                                        <th className="px-4 py-3">Particulars</th>
                                        <th className="px-4 py-3 text-right">Debit</th>
                                        <th className="px-4 py-3 text-right">Credit</th>
                                        <th className="px-4 py-3 text-right">Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {/* Opening Balance */}
                                    <tr className="bg-blue-50/50 dark:bg-blue-900/10 font-bold text-gray-700 dark:text-gray-300">
                                        <td className="px-4 py-3" colSpan="5">Opening Balance</td>
                                        <td className="px-4 py-3 text-right font-mono">
                                            {data?.openingBalance?.toFixed(2)}
                                        </td>
                                    </tr>

                                    {/* Transactions */}
                                    {data?.entries.map((entry) => (
                                        <tr key={entry._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                                {new Date(entry.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="bg-gray-100 dark:bg-gray-800 text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-700 font-medium">
                                                    {entry.type} #{entry.voucherNo}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                                                {entry.narration || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-green-600 dark:text-green-400">
                                                {entry.debit > 0 ? entry.debit.toFixed(2) : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-red-600 dark:text-red-400">
                                                {entry.credit > 0 ? entry.credit.toFixed(2) : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono font-bold text-gray-700 dark:text-gray-300">
                                                {entry.runningBalance.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}

                                    {/* Empty State */}
                                    {data?.entries.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                                                No transactions found in this period.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot className="bg-gray-100 dark:bg-gray-800 font-bold border-t-2 border-gray-300 dark:border-gray-600">
                                    <tr>
                                        <td className="px-4 py-3" colSpan="5">Closing Balance</td>
                                        <td className="px-4 py-3 text-right font-mono text-brand-600 dark:text-brand-400">
                                            {data?.closingBalance?.toFixed(2)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                    <button
                        onClick={() => window.print()}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <Printer size={16} /> Print Report
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LedgerVoucherModal;
