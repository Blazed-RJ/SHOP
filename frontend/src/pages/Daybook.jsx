import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import ConfirmationModal from '../components/ConfirmationModal';
import api from '../utils/api';
import { formatINR } from '../utils/currency';
import { formatDate } from '../utils/date';
import {
    BookOpen,
    Calendar,
    TrendingUp,
    IndianRupee,
    ArrowUpCircle,
    ArrowDownCircle,
    Trash2,
    ChevronDown,
    ChevronRight,
    Eye,
    Banknote,
    CreditCard,
    Smartphone,
    Building2,
    Wallet,
    Edit
} from 'lucide-react';
import toast from 'react-hot-toast';
import RecordPaymentModal from '../components/RecordPaymentModal';
import AdjustBalanceModal from '../components/AdjustBalanceModal';


const Daybook = () => {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
    const [daybookData, setDaybookData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedRows, setExpandedRows] = useState(new Set());

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState(null);

    const loadDaybook = useCallback(async () => {
        try {
            setLoading(true);
            // Safety check: use today's date if selectedDate is empty
            const dateToFetch = selectedDate || new Date().toLocaleDateString('en-CA');
            const { data } = await api.get(`/ledger/daybook?date=${dateToFetch}`);
            setDaybookData(data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to load daybook:', error);
            toast.error('Failed to load daybook');
            setLoading(false);
        }
    }, [selectedDate]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
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
            .filter(t => t.type === 'Sale' || t.type === 'Invoice')
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

    const toggleRowExpand = (transactionId) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(transactionId)) {
            newExpanded.delete(transactionId);
        } else {
            newExpanded.add(transactionId);
        }
        setExpandedRows(newExpanded);
    };

    const getPaymentModeIcon = (mode) => {
        switch (mode?.toLowerCase()) {
            case 'cash':
                return <Banknote className="w-4 h-4" />;
            case 'bank transfer':
            case 'bank':
                return <Building2 className="w-4 h-4" />;
            case 'card':
            case 'credit card':
            case 'debit card':
                return <CreditCard className="w-4 h-4" />;
            case 'upi':
            case 'online':
                return <Smartphone className="w-4 h-4" />;
            default:
                return <Wallet className="w-4 h-4" />;
        }
    };

    const getPaymentModeColor = (mode) => {
        switch (mode?.toLowerCase()) {
            case 'cash':
                return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'bank transfer':
            case 'bank':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'card':
            case 'credit card':
            case 'debit card':
                return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
            case 'upi':
            case 'online':
                return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
        }
    };

    const navigateToPartyLedger = (party, type) => {
        if (!party?._id) return;

        if (type === 'Customer') {
            navigate(`/customers/${party._id}/ledger`);
        } else if (type === 'Supplier' || type === 'Expense') {
            navigate(`/expenses/${party._id}/ledger`);
        }
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
                        {/* Summary Cards - Premium Dashboard Style */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {/* Opening Balance (Blue) */}
                            <div className="bg-gradient-to-r from-blue-50 via-white to-white dark:bg-gradient-to-br dark:from-blue-950 dark:via-black dark:to-black rounded-2xl p-6 border-4 border-blue-200 dark:border-blue-500/30 shadow-sm dark:shadow-[0_0_20px_rgba(59,130,246,0.15)] relative overflow-hidden group transition-all duration-300">
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 dark:opacity-20 bg-repeat"></div>
                                <div className="relative z-10 w-full">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium text-blue-800/60 dark:text-blue-200 uppercase tracking-widest">Opening Balance</p>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setIsAdjustModalOpen(true); }}
                                                    className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded text-blue-500 transition-colors"
                                                    title="Adjust Opening Balance"
                                                >
                                                    <Edit className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <p className="text-2xl lg:text-3xl font-bold mt-2 text-blue-600 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-blue-100 dark:via-blue-300 dark:to-blue-500 font-mono">
                                                {formatINR(daybookData?.openingBalance || 0)}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-white/80 dark:bg-blue-500/20 rounded-xl border border-blue-100 dark:border-blue-500/30 text-blue-500 dark:text-blue-300 group-hover:text-white group-hover:bg-blue-600 dark:group-hover:bg-blue-500 transition-all duration-300 shadow-sm dark:shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                                            <IndianRupee className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <div className="mt-4 h-1 w-full bg-blue-50 dark:bg-blue-900/30 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 w-full rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Total Cash In (Green) */}
                            <div className="bg-gradient-to-r from-emerald-50 via-white to-white dark:bg-gradient-to-br dark:from-emerald-950 dark:via-black dark:to-black rounded-2xl p-6 border-4 border-emerald-200 dark:border-emerald-500/30 shadow-sm dark:shadow-[0_0_20px_rgba(16,185,129,0.15)] relative overflow-hidden group transition-all duration-300">
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 dark:opacity-20 bg-repeat"></div>
                                <div className="relative z-10 w-full">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-emerald-800/60 dark:text-emerald-200 uppercase tracking-widest">Total Cash In</p>
                                            <p className="text-2xl lg:text-3xl font-bold mt-2 text-emerald-600 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-emerald-100 dark:via-emerald-300 dark:to-emerald-500 font-mono">
                                                {formatINR(getTotalCashIn())}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-white/80 dark:bg-emerald-500/20 rounded-xl border border-emerald-100 dark:border-emerald-500/30 text-emerald-500 dark:text-emerald-300 group-hover:text-white group-hover:bg-emerald-600 dark:group-hover:bg-emerald-500 transition-all duration-300 shadow-sm dark:shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                                            <ArrowDownCircle className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <div className="mt-4 h-1 w-full bg-emerald-50 dark:bg-emerald-900/30 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 w-3/4 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Total Cash Out (Red) */}
                            <div className="bg-gradient-to-r from-red-50 via-white to-white dark:bg-gradient-to-br dark:from-red-950 dark:via-black dark:to-black rounded-2xl p-6 border-4 border-red-200 dark:border-red-500/30 shadow-sm dark:shadow-[0_0_20px_rgba(239,68,68,0.15)] relative overflow-hidden group transition-all duration-300">
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 dark:opacity-20 bg-repeat"></div>
                                <div className="relative z-10 w-full">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-red-800/60 dark:text-red-200 uppercase tracking-widest">Total Cash Out</p>
                                            <p className="text-2xl lg:text-3xl font-bold mt-2 text-red-600 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-red-100 dark:via-red-300 dark:to-red-500 font-mono">
                                                {formatINR(getTotalCashOut())}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-white/80 dark:bg-red-500/20 rounded-xl border border-red-100 dark:border-red-500/30 text-red-500 dark:text-red-300 group-hover:text-white group-hover:bg-red-600 dark:group-hover:bg-red-500 transition-all duration-300 shadow-sm dark:shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                                            <ArrowUpCircle className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <div className="mt-4 h-1 w-full bg-red-50 dark:bg-red-900/30 rounded-full overflow-hidden">
                                        <div className="h-full bg-red-500 w-3/4 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Closing Balance (Purple) */}
                            <div className="bg-gradient-to-r from-purple-50 via-white to-white dark:bg-gradient-to-br dark:from-purple-950 dark:via-black dark:to-black rounded-2xl p-6 border-4 border-purple-200 dark:border-purple-500/30 shadow-sm dark:shadow-[0_0_20px_rgba(168,85,247,0.15)] relative overflow-hidden group transition-all duration-300">
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 dark:opacity-20 bg-repeat"></div>
                                <div className="relative z-10 w-full">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-purple-800/60 dark:text-purple-200 uppercase tracking-widest">Closing Balance</p>
                                            <p className="text-2xl lg:text-3xl font-bold mt-2 text-purple-600 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-purple-100 dark:via-purple-300 dark:to-purple-500 font-mono">
                                                {formatINR(getClosingBalance())}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-white/80 dark:bg-purple-500/20 rounded-xl border border-purple-100 dark:border-purple-500/30 text-purple-500 dark:text-purple-300 group-hover:text-white group-hover:bg-purple-600 dark:group-hover:bg-purple-500 transition-all duration-300 shadow-sm dark:shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                                            <TrendingUp className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <div className="mt-4 h-1 w-full bg-purple-50 dark:bg-purple-900/30 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-500 w-full rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Transactions Table */}
                        <div className="bg-blue-50/40 dark:bg-blue-900/10 box-outline p-6 transition-all duration-300">
                            <div className="flex flex-wrap gap-4 items-center justify-between border-b-[2.5px] border-black dark:border-white/90 pb-4 mb-4">
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
                                <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
                                    <table className="w-full relative">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50 border-b-[2.5px] border-black dark:border-white/90 sticky top-0 z-10 shadow-sm">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700 w-12">
                                                    {/* Expand icon */}
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700">
                                                    Type
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700">
                                                    Description
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700">
                                                    Party
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700">
                                                    Payment Mode
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700">
                                                    Cash In
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700">
                                                    Cash Out
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700">
                                                    Balance
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700">
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
                                                const isExpanded = expandedRows.has(transaction._id);
                                                const hasDetails = transaction.notes || transaction.billNumber;

                                                return (
                                                    <React.Fragment key={transaction._id}>
                                                        <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                            {/* Expand Icon */}
                                                            <td className="px-4 py-4">
                                                                {hasDetails && (
                                                                    <button
                                                                        onClick={() => toggleRowExpand(transaction._id)}
                                                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                                                        title={isExpanded ? "Collapse details" : "View details"}
                                                                    >
                                                                        {isExpanded ? (
                                                                            <ChevronDown className="w-4 h-4" />
                                                                        ) : (
                                                                            <ChevronRight className="w-4 h-4" />
                                                                        )}
                                                                    </button>
                                                                )}
                                                            </td>

                                                            {/* Type */}
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

                                                            {/* Description */}
                                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                                                {transaction.description}
                                                            </td>

                                                            {/* Party - Clickable */}
                                                            <td className="px-6 py-4 text-sm">
                                                                {transaction.party?.name ? (
                                                                    <button
                                                                        onClick={() => navigateToPartyLedger(transaction.party, transaction.partyType)}
                                                                        className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                                                        title={`View ${transaction.party.name}'s ledger`}
                                                                    >
                                                                        {transaction.party.name}
                                                                    </button>
                                                                ) : (
                                                                    <span className="text-gray-400">-</span>
                                                                )}
                                                            </td>

                                                            {/* Payment Mode */}
                                                            <td className="px-6 py-4">
                                                                {transaction.paymentMode ? (
                                                                    <span className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold ${getPaymentModeColor(transaction.paymentMode)}`}>
                                                                        {getPaymentModeIcon(transaction.paymentMode)}
                                                                        <span>{transaction.paymentMode}</span>
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-gray-400 text-xs">-</span>
                                                                )}
                                                            </td>

                                                            {/* Cash In */}
                                                            <td className="px-6 py-4 text-right text-sm font-semibold text-green-600 dark:text-green-400 rupee">
                                                                {isCashIn ? formatINR(transaction.amount) : '-'}
                                                            </td>

                                                            {/* Cash Out */}
                                                            <td className="px-6 py-4 text-right text-sm font-semibold text-red-600 dark:text-red-400 rupee">
                                                                {!isCashIn ? formatINR(transaction.amount) : '-'}
                                                            </td>

                                                            {/* Balance */}
                                                            <td className="px-6 py-4 text-right text-sm font-bold text-gray-900 dark:text-white rupee">
                                                                {formatINR(runningBalance)}
                                                            </td>

                                                            {/* Actions */}
                                                            <td className="px-6 py-4 text-right">
                                                                <div className="flex items-center justify-end space-x-2">
                                                                    {hasDetails && (
                                                                        <button
                                                                            onClick={() => toggleRowExpand(transaction._id)}
                                                                            className="text-gray-400 hover:text-indigo-500 p-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                                                                            title="View Details"
                                                                        >
                                                                            <Eye className="w-4 h-4" />
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        onClick={() => handleDelete(transaction._id)}
                                                                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                                        title="Delete Transaction"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>

                                                        {/* Expandable Detail Row */}
                                                        {isExpanded && hasDetails && (
                                                            <tr className="bg-gray-50 dark:bg-gray-800/50">
                                                                <td colSpan="9" className="px-6 py-4">
                                                                    <div className="bg-white dark:bg-gray-700/30 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                                                                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                                                                            <Eye className="w-4 h-4 mr-2" />
                                                                            Transaction Details
                                                                        </h4>
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                            {transaction.billNumber && (
                                                                                <div>
                                                                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                                                                                        Bill Number
                                                                                    </p>
                                                                                    <p className="text-sm text-gray-900 dark:text-white font-mono">
                                                                                        {transaction.billNumber}
                                                                                    </p>
                                                                                </div>
                                                                            )}
                                                                            {transaction.notes && (
                                                                                <div className={transaction.billNumber ? '' : 'md:col-span-2'}>
                                                                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                                                                                        Notes / Remarks
                                                                                    </p>
                                                                                    <p className="text-sm text-gray-900 dark:text-white">
                                                                                        {transaction.notes}
                                                                                    </p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}

                                            {/* Closing Balance Row */}
                                            <tr className="bg-gray-100 dark:bg-gray-700 font-bold">
                                                <td colSpan="5" className="px-6 py-4 text-right text-gray-900 dark:text-white">
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
                                                <td></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div >
                            )}
                        </div >
                    </>
                )}
            </div >

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
                defaultDate={selectedDate}
            />

            {isAdjustModalOpen && (
                <AdjustBalanceModal
                    isOpen={isAdjustModalOpen}
                    onClose={() => setIsAdjustModalOpen(false)}
                    onSuccess={loadDaybook}
                    currentBalance={daybookData?.openingBalance || 0}
                    date={selectedDate}
                />
            )}
        </Layout >
    );
};

export default Daybook;
