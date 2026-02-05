import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout/Layout';
import api from '../utils/api';
import { formatDate } from '../utils/date';
import { formatINR } from '../utils/currency';
import { Plus, Filter, Calendar as CalendarIcon, Trash2, Search, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import RecordPaymentModal from '../components/RecordPaymentModal';
import toast from 'react-hot-toast';

const Expenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Filters
    const [dateRange, setDateRange] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [categoryFilter, setCategoryFilter] = useState('All');

    const fetchExpenses = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/payments/expenses', {
                params: {
                    startDate: dateRange.startDate,
                    endDate: dateRange.endDate,
                    category: categoryFilter
                }
            });
            setExpenses(data);
        } catch (error) {
            console.error('Error fetching expenses:', error);
            toast.error('Failed to load expenses');
        } finally {
            setLoading(false);
        }
    }, [dateRange, categoryFilter]);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this expense?')) return;
        try {
            await api.delete(`/payments/${id}`);
            toast.success('Expense deleted');
            fetchExpenses();
        } catch (error) {
            toast.error('Failed to delete expense');
        }
    };

    const totalAmount = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);

    return (
        <Layout>
            <div className="p-6 max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Expenses</h1>
                        <p className="text-gray-500 dark:text-gray-400">Track your business spending and personal withdrawals</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center space-x-2 px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl shadow-[0_20px_40px_rgba(220,38,38,0.2)] hover:shadow-[0_25px_50px_rgba(220,38,38,0.3)] transition-all duration-300 transform hover:-translate-y-1 group"
                    >
                        <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                        <span className="font-black tracking-tight text-lg">Add Expense</span>
                    </button>
                </div>

                {/* Filters & Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Date Filter */}
                    <div className="md:col-span-2 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
                        <div className="flex items-center gap-2 flex-1">
                            <span className="text-xs font-bold text-gray-500 uppercase">From</span>
                            <input
                                type="date"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                className="w-full bg-transparent border-none focus:ring-0 text-sm font-semibold text-gray-900 dark:text-white p-0"
                            />
                        </div>
                        <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
                        <div className="flex items-center gap-2 flex-1">
                            <span className="text-xs font-bold text-gray-500 uppercase">To</span>
                            <input
                                type="date"
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                className="w-full bg-transparent border-none focus:ring-0 text-sm font-semibold text-gray-900 dark:text-white p-0"
                            />
                        </div>
                    </div>

                    {/* Category Filter */}
                    <div className="bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex p-1">
                        {['All', 'Expense', 'Drawing'].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategoryFilter(cat)}
                                className={`flex-1 rounded-xl text-sm font-semibold transition-all ${categoryFilter === cat
                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Total Card */}
                    <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl border border-red-100 dark:border-red-900/30 flex flex-col justify-center">
                        <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">Total Spending</span>
                        <span className="text-2xl font-black text-gray-900 dark:text-white rupee">{formatINR(totalAmount)}</span>
                    </div>
                </div>

                {/* List */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 text-left">
                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Date</th>
                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Category</th>
                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Details</th>
                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Amount</th>
                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">Loading...</td>
                                    </tr>
                                ) : expenses.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                            No expenses found for this period.
                                        </td>
                                    </tr>
                                ) : (
                                    expenses.map(expense => (
                                        <tr key={expense._id} className="group hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                                                {formatDate(expense.date)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${expense.category === 'Drawing'
                                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                    }`}>
                                                    {expense.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900 dark:text-white font-medium">{expense.notes}</div>
                                                <div className="text-xs text-gray-500">{expense.method} • {expense.sourceAccount || 'Cash Drawer'}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-sm font-bold text-gray-900 dark:text-white rupee">
                                                    {formatINR(expense.amount)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleDelete(expense._id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <RecordPaymentModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={fetchExpenses}
                    defaultTab="expense"
                />
            </div>
        </Layout>
    );
};

export default Expenses;
