import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
    BookOpen
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmationModal from '../components/ConfirmationModal';

const Expenses = () => {
    const navigate = useNavigate();
    const [expenseHeads, setExpenseHeads] = useState([]);
    const [filteredExpenseHeads, setFilteredExpenseHeads] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [expenseToDelete, setExpenseToDelete] = useState(null);

    const fetchExpenseHeads = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/suppliers');
            // Filter for type 'Expense'
            const heads = data.filter(s => s.type === 'Expense');
            setExpenseHeads(heads);
            setFilteredExpenseHeads(heads);
        } catch (error) {
            console.error('Error fetching expense heads:', error);
            toast.error('Failed to load expense heads');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchExpenseHeads();
    }, [fetchExpenseHeads]);

    useEffect(() => {
        if (searchQuery) {
            const filtered = expenseHeads.filter(e =>
                e.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredExpenseHeads(filtered);
        } else {
            setFilteredExpenseHeads(expenseHeads);
        }
    }, [searchQuery, expenseHeads]);

    const handleDeleteClick = (expense) => {
        setExpenseToDelete(expense);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!expenseToDelete) return;

        try {
            await api.delete(`/suppliers/${expenseToDelete._id}`);
            toast.success('Expense head deleted successfully');
            fetchExpenseHeads();
            setExpenseToDelete(null);
        } catch {
            toast.error('Failed to delete expense head');
        }
    };

    const handleEdit = (expense) => {
        setEditingExpense(expense);
        setShowModal(true);
    };

    const handleAdd = () => {
        setEditingExpense(null);
        setShowModal(true);
    };

    return (
        <Layout>
            <div className="p-4 md:p-8 min-h-screen bg-gray-50/50 dark:bg-[#050505] transition-colors duration-500">
                {/* Header Section */}
                <div className="mb-10 relative">
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-red-500/10 blur-[120px] rounded-full pointer-events-none"></div>
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
                                Manage expense categories and track total spending
                            </p>
                        </div>
                        <button
                            onClick={handleAdd}
                            className="flex items-center space-x-2 px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl shadow-[0_20px_40px_rgba(220,38,38,0.2)] hover:shadow-[0_25px_50px_rgba(220,38,38,0.3)] transition-all duration-300 transform hover:-translate-y-1 group"
                        >
                            <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                            <span className="font-black tracking-tight text-lg">Add Expense Head</span>
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="mb-8 relative z-10 max-w-4xl mx-auto">
                    <div className="bg-white dark:bg-[#0a0a0a] p-2 rounded-2xl border border-red-500/30 shadow-[0_4px_20px_-8px_rgba(220,38,38,0.3)] transition-all duration-300">
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

                {/* Expense Grid */}
                {loading ? (
                    <div className="bg-white/50 dark:bg-black/20 backdrop-blur-xl rounded-[32px] border border-white dark:border-white/5 p-20 text-center">
                        <div className="relative inline-block">
                            <div className="w-16 h-16 border-t-2 border-red-500 rounded-full animate-spin mx-auto"></div>
                            <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full"></div>
                        </div>
                        <p className="mt-4 text-red-600 dark:text-red-400 font-bold tracking-widest uppercase text-xs animate-pulse font-mono">Loading Expenses...</p>
                    </div>
                ) : filteredExpenseHeads.length === 0 ? (
                    <div className="bg-white/50 dark:bg-black/20 backdrop-blur-xl rounded-[32px] border border-white dark:border-white/5 p-20 text-center group">
                        <div className="relative inline-block mb-6">
                            <div className="absolute inset-0 bg-red-500/10 blur-3xl rounded-full group-hover:bg-red-500/20 transition-all duration-700"></div>
                            <IndianRupee className="w-20 h-20 text-red-500/20 group-hover:text-red-500/40 transition-all duration-500 relative z-10 mx-auto" strokeWidth={1} />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">No Expense Heads Found</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Create your first expense category to start tracking spending.</p>
                        <button onClick={handleAdd} className="mt-8 px-8 py-3 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all duration-300 font-bold uppercase tracking-widest text-xs">
                            Add Expense Head
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                        {filteredExpenseHeads.map((expense) => (
                            <div
                                key={expense._id}
                                className="bg-[#FFF5F5] dark:bg-[#0a0a0a] rounded-[32px] border-[1.5px] border-red-400/40 p-6 shadow-sm hover:shadow-[0_8px_30px_-10px_rgba(220,38,38,0.2)] transition-all duration-300 group"
                            >
                                {/* Header Pill */}
                                <div className="border border-black/80 dark:border-white/80 rounded-full p-2 flex items-center gap-4 mb-4 bg-white dark:bg-black/40">
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400 font-bold text-lg border border-red-200 dark:border-red-500/30">
                                            {expense.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-black"></div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                                            {expense.name}
                                        </span>
                                        <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                            ID: {expense._id.slice(-6).toUpperCase()}
                                        </span>
                                    </div>
                                </div>

                                {/* Total Spent Container */}
                                <div className="border border-black/80 dark:border-white/80 rounded-2xl p-4 bg-gray-50/50 dark:bg-white/5 relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Total Spent</span>
                                        <IndianRupee className="w-3 h-3 text-gray-300" />
                                    </div>

                                    <div className="text-xl font-bold font-mono tracking-tighter mb-3 text-red-600 dark:text-red-400">
                                        {formatINR(Math.abs(expense.balance || 0))}
                                    </div>

                                    <div className="flex items-center space-x-2 mb-2">
                                        <div className="h-1 flex-1 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-1000 bg-red-500"
                                                style={{ width: expense.balance === 0 ? '0%' : '65%' }}
                                            ></div>
                                        </div>
                                        <span className="text-[9px] font-bold text-red-500 uppercase">
                                            EXP
                                        </span>
                                    </div>
                                </div>

                                {/* Hover Actions */}
                                <div className="flex items-center justify-end space-x-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <button
                                        onClick={() => navigate(`/expenses/${expense._id}/ledger`)}
                                        className="p-2 text-gray-400 hover:text-indigo-500 transition-colors"
                                        title="View Ledger"
                                    >
                                        <BookOpen className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleEdit(expense)}
                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                        title="Edit"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(expense)}
                                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add/Edit Expense Modal */}
            {showModal && (
                <ExpenseModal
                    expense={editingExpense}
                    onClose={() => {
                        setShowModal(false);
                        setEditingExpense(null);
                    }}
                    onSuccess={() => {
                        setShowModal(false);
                        setEditingExpense(null);
                        fetchExpenseHeads();
                    }}
                />
            )}

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setExpenseToDelete(null);
                }}
                onConfirm={confirmDelete}
                title="Delete Expense Head"
                message={`Are you sure you want to delete "${expenseToDelete?.name}"? This action cannot be undone.`}
                confirmText="Delete Expense Head"
                isDangerous={true}
            />
        </Layout>
    );
};

// Expense Modal Component
const ExpenseModal = ({ expense, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: expense?.name || '',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (expense) {
                await api.put(`/suppliers/${expense._id}`, { ...formData, type: 'Expense' });
                toast.success('Expense head updated successfully');
            } else {
                await api.post('/suppliers', { ...formData, type: 'Expense', phone: '0000000000' });
                toast.success('Expense head added successfully');
            }
            onSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save expense head');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-100 dark:border-gray-700">
                <div className="p-6 border-b-[2.5px] border-black dark:border-white/90 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {expense ? 'Edit Expense Head' : 'Add New Expense Head'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Expense Category Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                            placeholder="e.g., Internet Bill, Office Rent, Electricity"
                            required
                        />
                    </div>

                    <div className="flex items-center justify-end space-x-3 pt-4 border-t-[2.5px] border-black dark:border-white/90">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : expense ? 'Update Expense Head' : 'Add Expense Head'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Expenses;
