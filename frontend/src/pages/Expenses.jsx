import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout/Layout';
import api from '../utils/api';
import { formatINR } from '../utils/currency';
import {
    IndianRupee,
    Search,
    Plus,
    Edit2,
    Trash2,
    X,
    BookOpen,
    RefreshCcw,
    Calendar,
    Zap,
    CreditCard
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmationModal from '../components/ConfirmationModal';

// ── helpers ────────────────────────────────────────────────────────────────
const FREQ_LABELS = { Monthly: 'Monthly', Weekly: 'Weekly', Yearly: 'Yearly' };
const METHOD_OPTIONS = ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Cheque', 'Online'];

const isOverdue = (nextDue) => nextDue && new Date(nextDue) < new Date();
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ── main page ───────────────────────────────────────────────────────────────
const Expenses = () => {
    const [expenseHeads, setExpenseHeads] = useState([]);
    const [filteredHeads, setFilteredHeads] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [expenseToDelete, setExpenseToDelete] = useState(null);
    const [payNowTarget, setPayNowTarget] = useState(null); // for quick pay modal

    const fetchExpenseHeads = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/suppliers/expense-heads');
            setExpenseHeads(data);
            setFilteredHeads(data);
        } catch (error) {
            console.error('Error fetching expense heads:', error);
            toast.error('Failed to load expense heads');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchExpenseHeads(); }, [fetchExpenseHeads]);

    useEffect(() => {
        const q = searchQuery.toLowerCase();
        setFilteredHeads(q ? expenseHeads.filter(e => e.name.toLowerCase().includes(q)) : expenseHeads);
    }, [searchQuery, expenseHeads]);

    const confirmDelete = async () => {
        if (!expenseToDelete) return;
        try {
            await api.delete(`/suppliers/${expenseToDelete._id}`);
            toast.success('Expense head deleted');
            fetchExpenseHeads();
            setExpenseToDelete(null);
        } catch {
            toast.error('Failed to delete expense head');
        }
    };

    return (
        <Layout>
            <div className="p-4 md:p-8 min-h-screen bg-gray-50/50 dark:bg-[#050505] transition-colors duration-500">
                {/* Header */}
                <div className="mb-10 relative">
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-red-500/10 blur-[120px] rounded-full pointer-events-none" />
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                        <div>
                            <div className="flex items-center space-x-3 mb-2">
                                <div className="p-2 bg-red-500/10 rounded-lg">
                                    <IndianRupee className="w-5 h-5 text-red-500" />
                                </div>
                                <span className="text-red-600 dark:text-red-400 text-xs font-black uppercase tracking-[0.3em]">Expense Management</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-500">Expense Heads</span>
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium max-w-md">
                                Manage expense categories and recurring autopay schedules
                            </p>
                        </div>
                        <button
                            onClick={() => { setEditingExpense(null); setShowModal(true); }}
                            className="flex items-center space-x-2 px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl shadow-[0_20px_40px_rgba(220,38,38,0.2)] hover:shadow-[0_25px_50px_rgba(220,38,38,0.3)] transition-all duration-300 transform hover:-translate-y-1 group"
                        >
                            <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                            <span className="font-black tracking-tight text-lg">Add Expense Head</span>
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="mb-8 relative z-10 max-w-4xl mx-auto">
                    <div className="bg-white dark:bg-[#0a0a0a] p-2 rounded-2xl border border-red-500/30 shadow-[0_4px_20px_-8px_rgba(220,38,38,0.3)]">
                        <div className="flex items-center px-4">
                            <Search className="w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search expense categories by name..."
                                className="w-full pl-4 pr-4 py-3 bg-transparent border-none text-gray-900 dark:text-white placeholder-gray-400 focus:ring-0 text-sm font-medium"
                            />
                        </div>
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="bg-white/50 dark:bg-black/20 backdrop-blur-xl rounded-[32px] border border-white dark:border-white/5 p-20 text-center">
                        <div className="relative inline-block">
                            <div className="w-16 h-16 border-t-2 border-red-500 rounded-full animate-spin mx-auto" />
                            <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full" />
                        </div>
                        <p className="mt-4 text-red-600 dark:text-red-400 font-bold tracking-widest uppercase text-xs animate-pulse font-mono">Loading Expenses...</p>
                    </div>
                ) : filteredHeads.length === 0 ? (
                    <div className="bg-white/50 dark:bg-black/20 backdrop-blur-xl rounded-[32px] border border-white dark:border-white/5 p-20 text-center group">
                        <div className="relative inline-block mb-6">
                            <div className="absolute inset-0 bg-red-500/10 blur-3xl rounded-full" />
                            <IndianRupee className="w-20 h-20 text-red-500/20 relative z-10 mx-auto" strokeWidth={1} />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white">No Expense Heads Found</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Create your first expense category to start tracking spending.</p>
                        <button onClick={() => { setEditingExpense(null); setShowModal(true); }} className="mt-8 px-8 py-3 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all duration-300 font-bold uppercase tracking-widest text-xs">
                            Add Expense Head
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                        {filteredHeads.map((expense) => {
                            const overdue = isOverdue(expense.autopay?.nextDue);
                            return (
                                <div
                                    key={expense._id}
                                    className={`bg-[#FFF5F5] dark:bg-[#0a0a0a] rounded-[32px] border-[1.5px] ${overdue ? 'border-orange-400/60' : 'border-red-400/40'} p-6 shadow-sm hover:shadow-[0_8px_30px_-10px_rgba(220,38,38,0.2)] transition-all duration-300 group`}
                                >
                                    {/* Header Pill */}
                                    <div className="border border-black/80 dark:border-white/80 rounded-full p-2 flex items-center gap-4 mb-4 bg-white dark:bg-black/40">
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400 font-bold text-lg border border-red-200 dark:border-red-500/30">
                                                {expense.name.charAt(0).toUpperCase()}
                                            </div>
                                            {expense.autopay?.enabled && (
                                                <div className={`absolute -top-0.5 -right-0.5 w-3 h-3 ${overdue ? 'bg-orange-500' : 'bg-green-500'} rounded-full border-2 border-white dark:border-black`} />
                                            )}
                                        </div>
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <span className="text-base font-bold text-gray-900 dark:text-white leading-tight truncate">{expense.name}</span>
                                            <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">ID: {expense._id.slice(-6).toUpperCase()}</span>
                                        </div>
                                        {expense.autopay?.enabled && (
                                            <span className={`shrink-0 text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${overdue ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'}`}>
                                                {overdue ? '⚠ OVERDUE' : '⚡ AUTOPAY'}
                                            </span>
                                        )}
                                    </div>

                                    {/* Stats Row */}
                                    <div className="border border-black/80 dark:border-white/80 rounded-2xl p-4 bg-gray-50/50 dark:bg-white/5 mb-4">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Spent</span>
                                            <IndianRupee className="w-3 h-3 text-gray-300" />
                                        </div>
                                        <div className="text-xl font-bold font-mono tracking-tighter mb-2 text-red-600 dark:text-red-400">
                                            {formatINR(Math.abs(expense.balance || 0))}
                                        </div>

                                        {/* Autopay info */}
                                        {expense.autopay?.enabled && (
                                            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-white/10 space-y-1">
                                                <div className="flex items-center justify-between text-[10px]">
                                                    <span className="text-gray-400 flex items-center gap-1"><RefreshCcw className="w-2.5 h-2.5" /> {expense.autopay.frequency}</span>
                                                    <span className="font-bold text-gray-700 dark:text-gray-300">{formatINR(expense.autopay.amount)}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-[10px]">
                                                    <span className="text-gray-400 flex items-center gap-1"><Calendar className="w-2.5 h-2.5" /> Next Due</span>
                                                    <span className={`font-bold ${overdue ? 'text-orange-500' : 'text-gray-700 dark:text-gray-300'}`}>{formatDate(expense.autopay.nextDue)}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-[10px]">
                                                    <span className="text-gray-400 flex items-center gap-1"><CreditCard className="w-2.5 h-2.5" /> Method</span>
                                                    <span className="font-bold text-gray-700 dark:text-gray-300">{expense.autopay.method}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Pay Now button (autopay enabled) */}
                                    {expense.autopay?.enabled && (
                                        <button
                                            onClick={() => setPayNowTarget(expense)}
                                            className={`w-full mb-3 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${overdue ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-red-500/10 hover:bg-red-500 text-red-600 dark:text-red-400 hover:text-white border border-red-500/20'}`}
                                        >
                                            <Zap className="w-4 h-4" /> Pay Now {formatINR(expense.autopay.amount)}
                                        </button>
                                    )}

                                    {/* Actions */}
                                    <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <button
                                            onClick={() => { setEditingExpense(expense); setShowModal(true); }}
                                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                            title="Edit"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => { setExpenseToDelete(expense); setShowDeleteModal(true); }}
                                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {showModal && (
                <ExpenseModal
                    expense={editingExpense}
                    onClose={() => { setShowModal(false); setEditingExpense(null); }}
                    onSuccess={() => { setShowModal(false); setEditingExpense(null); fetchExpenseHeads(); }}
                />
            )}

            {payNowTarget && (
                <PayNowModal
                    expense={payNowTarget}
                    onClose={() => setPayNowTarget(null)}
                    onSuccess={() => { setPayNowTarget(null); fetchExpenseHeads(); }}
                />
            )}

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => { setShowDeleteModal(false); setExpenseToDelete(null); }}
                onConfirm={confirmDelete}
                title="Delete Expense Head"
                message={`Are you sure you want to delete "${expenseToDelete?.name}"?`}
                confirmText="Delete"
                isDangerous={true}
            />
        </Layout>
    );
};

// ── Add / Edit Modal ─────────────────────────────────────────────────────────
const ExpenseModal = ({ expense, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({ name: expense?.name || '' });
    const [autopay, setAutopay] = useState({
        enabled: expense?.autopay?.enabled || false,
        amount: expense?.autopay?.amount || '',
        frequency: expense?.autopay?.frequency || 'Monthly',
        dueDay: expense?.autopay?.dueDay || 1,
        method: expense?.autopay?.method || 'Cash',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const payload = {
            name: formData.name,
            autopay: {
                ...autopay,
                amount: Number(autopay.amount) || 0,
                dueDay: Number(autopay.dueDay) || 1,
            }
        };
        try {
            if (expense) {
                await api.put(`/suppliers/${expense._id}`, { ...payload, type: 'Expense' });
                toast.success('Expense head updated');
            } else {
                await api.post('/suppliers/expense-heads', payload);
                toast.success('Expense head added');
            }
            onSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save expense head');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="p-6 border-b-[2px] border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {expense ? 'Edit Expense Head' : 'Add Expense Head'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Category Name *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            placeholder="e.g., Internet Bill, Office Rent"
                            required
                        />
                    </div>

                    {/* Autopay Toggle */}
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div
                            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                            onClick={() => setAutopay(p => ({ ...p, enabled: !p.enabled }))}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${autopay.enabled ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                    <Zap className={`w-4 h-4 ${autopay.enabled ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
                                </div>
                                <div>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">Autopay Reminder</span>
                                    <p className="text-xs text-gray-400">{autopay.enabled ? 'Enabled — set schedule below' : 'Enable to track recurring payments'}</p>
                                </div>
                            </div>
                            {/* Toggle */}
                            <div className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${autopay.enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${autopay.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                            </div>
                        </div>

                        {autopay.enabled && (
                            <div className="p-4 pt-0 space-y-3 border-t border-gray-100 dark:border-gray-800">
                                {/* Amount + Method row */}
                                <div className="grid grid-cols-2 gap-3 mt-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Amount (₹) *</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={autopay.amount}
                                            onChange={(e) => setAutopay(p => ({ ...p, amount: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
                                            placeholder="0"
                                            required={autopay.enabled}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Frequency</label>
                                        <select
                                            value={autopay.frequency}
                                            onChange={(e) => setAutopay(p => ({ ...p, frequency: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
                                        >
                                            {Object.keys(FREQ_LABELS).map(f => <option key={f} value={f}>{f}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Due day + Method */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">
                                            {autopay.frequency === 'Weekly' ? 'Day of Week (0=Sun)' : 'Day of Month'}
                                        </label>
                                        <input
                                            type="number"
                                            min={autopay.frequency === 'Weekly' ? 0 : 1}
                                            max={autopay.frequency === 'Weekly' ? 6 : 31}
                                            value={autopay.dueDay}
                                            onChange={(e) => setAutopay(p => ({ ...p, dueDay: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Payment Method</label>
                                        <select
                                            value={autopay.method}
                                            onChange={(e) => setAutopay(p => ({ ...p, method: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
                                        >
                                            {METHOD_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end space-x-3 pt-2">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300 font-medium">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="px-6 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 font-bold">
                            {loading ? 'Saving...' : expense ? 'Update' : 'Add Expense Head'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── Pay Now Modal ────────────────────────────────────────────────────────────
const PayNowModal = ({ expense, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        amount: expense.autopay?.amount || '',
        method: expense.autopay?.method || 'Cash',
        notes: '',
        date: new Date().toISOString().split('T')[0],
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Record expense payment
            await api.post('/payments/expense', {
                amount: Number(formData.amount),
                method: formData.method,
                notes: formData.notes || `${expense.name} payment`,
                name: expense.name,
                category: 'Expense',
                date: formData.date,
            });

            // Update autopay.lastPaid + compute nextDue on the supplier
            await api.put(`/suppliers/${expense._id}`, {
                type: 'Expense',
                'autopay.lastPaid': new Date().toISOString(),
                // nextDue will be recomputed by the backend update logic (or we just clear it and let next fetch recalculate)
                [`autopay.nextDue`]: null, // backend can recompute, or front-end can show "paid"
            });

            toast.success(`₹${formData.amount} recorded for ${expense.name}`);
            onSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Payment failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-sm w-full border border-gray-100 dark:border-gray-800">
                <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Zap className="w-5 h-5 text-orange-500" /> Pay Expense
                        </h2>
                        <p className="text-xs text-gray-400 mt-0.5">{expense.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500"><X className="w-5 h-5" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Amount (₹)</label>
                            <input
                                type="number" min="1" required
                                value={formData.amount}
                                onChange={(e) => setFormData(p => ({ ...p, amount: e.target.value }))}
                                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono font-bold bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-400"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Date</label>
                            <input
                                type="date" required
                                value={formData.date}
                                onChange={(e) => setFormData(p => ({ ...p, date: e.target.value }))}
                                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-400"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Method</label>
                        <select
                            value={formData.method}
                            onChange={(e) => setFormData(p => ({ ...p, method: e.target.value }))}
                            className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-400"
                        >
                            {METHOD_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Notes (Optional)</label>
                        <input
                            type="text"
                            value={formData.notes}
                            onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                            placeholder={`${expense.name} payment`}
                            className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-400"
                        />
                    </div>
                    <button
                        type="submit" disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl font-bold text-base shadow-lg transition-all disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : `Confirm Payment`}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Expenses;
