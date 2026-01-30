import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout/Layout';
import ConfirmationModal from '../components/ConfirmationModal';
import api from '../utils/api';
import { formatINR } from '../utils/currency';
import { formatDate } from '../utils/date';
import {
    BookOpen,
    Calendar,
    TrendingUp,
    TrendingDown,
    IndianRupee,
    ArrowUpCircle,
    ArrowDownCircle,
    Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import RecordPaymentModal from '../components/RecordPaymentModal';

const Daybook = () => {
    const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
    const [daybookData, setDaybookData] = useState(null);
    const [loading, setLoading] = useState(true);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState(null);

    const loadDaybook = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/ledger/daybook?date=${selectedDate}`);
            setDaybookData(data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to load daybook:', error);
            toast.error('Failed to load daybook');
            setLoading(false);
        }
    }, [selectedDate]);

    useEffect(() => {
        loadDaybook();
    }, [loadDaybook]);

    const handleDelete = (id) => {
        setTransactionToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!transactionToDelete) return;

        try {
            await api.delete(`/payments/${transactionToDelete}`);
            toast.success('Transaction deleted');
            loadDaybook();
            setIsDeleteModalOpen(false);
            setTransactionToDelete(null);
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete transaction');
        }
    };

    const getTotalCashIn = () => {
        if (!daybookData?.transactions) return 0;
        return daybookData.transactions
            .filter(t => t.type === 'Sale')
            .reduce((sum, t) => sum + t.amount, 0);
    };

    const getTotalCashOut = () => {
        if (!daybookData?.transactions) return 0;
        return daybookData.transactions
            .filter(t => t.type === 'Purchase' || t.type === 'Expense' || t.type === 'Drawing')
            .reduce((sum, t) => sum + t.amount, 0);
    };

    const getClosingBalance = () => {
        const opening = daybookData?.openingBalance || 0;
        const cashIn = getTotalCashIn();
        const cashOut = getTotalCashOut();
        return opening + cashIn - cashOut;
    };

    return (
        <Layout>
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Daybook</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Daily cash flow and transactions</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setIsPaymentModalOpen(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                        >
                            + Record Payment
                        </button>
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    </div>
                ) : (
                    <>
                        {/* Summary Cards - Kept vibrant but could add dark shadows/borders if needed */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="bg-blue-500 rounded-xl p-6 text-white shadow-sm">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium opacity-90">Opening Balance</p>
                                        <p className="text-2xl font-bold mt-2 rupee">
                                            {formatINR(daybookData?.openingBalance || 0)}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                                        <IndianRupee className="w-6 h-6" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-green-500 rounded-xl p-6 text-white shadow-sm">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium opacity-90">Total Cash In</p>
                                        <p className="text-2xl font-bold mt-2 rupee">
                                            {formatINR(getTotalCashIn())}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                                        <ArrowDownCircle className="w-6 h-6" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-red-500 rounded-xl p-6 text-white shadow-sm">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium opacity-90">Total Cash Out</p>
                                        <p className="text-2xl font-bold mt-2 rupee">
                                            {formatINR(getTotalCashOut())}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                                        <ArrowUpCircle className="w-6 h-6" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-purple-500 rounded-xl p-6 text-white shadow-sm">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium opacity-90">Closing Balance</p>
                                        <p className="text-2xl font-bold mt-2 rupee">
                                            {formatINR(getClosingBalance())}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                                        <TrendingUp className="w-6 h-6" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Transactions Table */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                                    <BookOpen className="w-5 h-5 mr-2 text-blue-500" />
                                    Transactions for {formatDate(selectedDate)}
                                </h2>
                            </div>

                            {!daybookData?.transactions || daybookData.transactions.length === 0 ? (
                                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                    <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p className="text-lg">No transactions for this date</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Type
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Description
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Party
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Cash In
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Cash Out
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Balance
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {daybookData.transactions.map((transaction, index) => {
                                                const isCashIn = transaction.type === 'Sale' || transaction.type === 'Invoice';
                                                const runningBalance = daybookData.openingBalance +
                                                    daybookData.transactions
                                                        .slice(0, index + 1)
                                                        .reduce((sum, t) => {
                                                            const isInc = t.type === 'Sale' || t.type === 'Invoice';
                                                            return sum + (isInc ? t.amount : -t.amount);
                                                        }, 0);

                                                return (
                                                    <tr key={transaction._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${transaction.type === 'Sale' || transaction.type === 'Invoice'
                                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                                : transaction.type === 'Purchase' || transaction.type === 'Expense' || transaction.type === 'Drawing'
                                                                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                                }`}>
                                                                {transaction.type}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                                            {transaction.description}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                            {transaction.party?.name || '-'}
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-sm font-semibold text-green-600 dark:text-green-400 rupee">
                                                            {isCashIn ? formatINR(transaction.amount) : '-'}
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-sm font-semibold text-red-600 dark:text-red-400 rupee">
                                                            {!isCashIn ? formatINR(transaction.amount) : '-'}
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-sm font-bold text-gray-900 dark:text-white rupee">
                                                            {formatINR(runningBalance)}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button
                                                                onClick={() => handleDelete(transaction._id)}
                                                                className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                                title="Delete Transaction"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}

                                            {/* Closing Balance Row */}
                                            <tr className="bg-gray-100 dark:bg-gray-700 font-bold">
                                                <td colSpan="3" className="px-6 py-4 text-right text-gray-900 dark:text-white">
                                                    Closing Balance:
                                                </td>
                                                <td className="px-6 py-4 text-right text-green-600 dark:text-green-400 rupee">
                                                    {formatINR(getTotalCashIn())}
                                                </td>
                                                <td className="px-6 py-4 text-right text-red-600 dark:text-red-400 rupee">
                                                    {formatINR(getTotalCashOut())}
                                                </td>
                                                <td className="px-6 py-4 text-right text-purple-600 dark:text-purple-400 rupee">
                                                    {formatINR(getClosingBalance())}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setTransactionToDelete(null);
                }}
                onConfirm={confirmDelete}
                title="Delete Transaction"
                message="Are you sure you want to delete this transaction? This will reverse the balance adjustment and cannot be undone."
                confirmText="Delete Transaction"
                cancelText="Cancel"
            />

            <RecordPaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                onSuccess={loadDaybook}
            />
        </Layout>
    );
};

export default Daybook;
