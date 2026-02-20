
import React, { useState } from 'react';
import { X, Save, AlertCircle, ArrowUpRight, ArrowDownRight, Wallet, Building2 } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-hot-toast';

const MoneyAdjustmentModal = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [transactionType, setTransactionType] = useState('add'); // 'add' or 'withdraw'
    const [mode, setMode] = useState('Cash'); // 'Cash' or 'Bank Transfer'
    const [formData, setFormData] = useState({
        amount: '',
        notes: '',
        date: new Date().toISOString().split('T')[0]
    });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                amount: parseFloat(formData.amount),
                type: transactionType === 'add' ? 'Debit' : 'Credit',
                category: transactionType === 'add' ? 'Receipt' : 'Drawing',
                method: mode,
                notes: formData.notes,
                date: formData.date
            };

            await api.post('/payments/adjust', payload);
            toast.success('Transaction recorded successfully');
            onSuccess();
            onClose();
            // Reset form
            setFormData({
                amount: '',
                notes: '',
                date: new Date().toISOString().split('T')[0]
            });
            setTransactionType('add');
            setMode('Cash');
        } catch (error) {
            console.error('Adjustment Error:', error);
            toast.error(error.response?.data?.message || 'Failed to record transaction');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#0a0a0a] rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden transform transition-all scale-100">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        {transactionType === 'add' ? (
                            <ArrowDownRight className="w-6 h-6 text-green-500" />
                        ) : (
                            <ArrowUpRight className="w-6 h-6 text-red-500" />
                        )}
                        {transactionType === 'add' ? 'Add Money' : 'Withdraw Money'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">

                    {/* Transaction Type Toggle */}
                    <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setTransactionType('add')}
                            className={`py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${transactionType === 'add'
                                ? 'bg-white dark:bg-gray-800 text-green-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            Add (+ In)
                        </button>
                        <button
                            type="button"
                            onClick={() => setTransactionType('withdraw')}
                            className={`py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${transactionType === 'withdraw'
                                ? 'bg-white dark:bg-gray-800 text-red-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            Withdraw (- Out)
                        </button>
                    </div>

                    {/* Amount & Date Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-1">
                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">Amount (₹)</label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-blue-500 rounded-xl font-mono text-lg font-bold text-gray-900 dark:text-white focus:outline-none transition-colors"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">Date</label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-blue-500 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {/* Mode Selection */}
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Mode</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setMode('Cash')}
                                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all ${mode === 'Cash'
                                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                                    : 'border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-600 dark:text-gray-400'
                                    }`}
                            >
                                <Wallet className="w-4 h-4" />
                                <span className="font-bold text-sm">Cash</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('Bank Transfer')}
                                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all ${mode === 'Bank Transfer'
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                                    : 'border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-600 dark:text-gray-400'
                                    }`}
                            >
                                <Building2 className="w-4 h-4" />
                                <span className="font-bold text-sm">Bank</span>
                            </button>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">Notes (Optional)</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-blue-500 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:outline-none transition-colors resize-none placeholder-gray-400"
                            placeholder="Reason for transaction..."
                            rows="2"
                        ></textarea>
                    </div>

                    {/* Footer / Submit */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading || !formData.amount}
                            className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 ${loading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : transactionType === 'add'
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-emerald-500/30'
                                    : 'bg-gradient-to-r from-red-500 to-orange-600 hover:shadow-red-500/30'
                                }`}
                        >
                            {loading ? (
                                <span className="animate-pulse">Processing...</span>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    {transactionType === 'add' ? 'Confirm Deposit' : 'Confirm Withdrawal'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MoneyAdjustmentModal;
