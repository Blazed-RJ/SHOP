import React, { useState, useEffect } from 'react';
import { X, Calculator, Info, Wallet } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import moment from 'moment-timezone';

const AdjustBalanceModal = ({ isOpen, onClose, onSuccess, currentBalance, date }) => {
    const [actualAmount, setActualAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [difference, setDifference] = useState(0);

    useEffect(() => {
        if (isOpen) {
            setActualAmount('');
            setDifference(0);
        }
    }, [isOpen]);

    const handleAmountChange = (e) => {
        const val = parseFloat(e.target.value) || 0;
        setActualAmount(e.target.value);
        setDifference(val - currentBalance);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const amount = parseFloat(actualAmount);
        if (isNaN(amount)) {
            toast.error('Please enter a valid amount');
            return;
        }

        if (difference === 0) {
            toast.success('Balance is already matching!');
            onClose();
            return;
        }

        const adjustmentAmount = Math.abs(difference);
        const isPositive = difference > 0; // Need to add cash (Receipt)

        // Backend types: 
        // Receipt (Capital Injection) -> type: 'Debit' (Cash come IN)
        // Drawing (Cash Removal) -> type: 'Credit' (Cash go OUT)

        // Backdate by 1 day so it affects Opening Balance of selected date
        const adjustmentDate = moment(date).subtract(1, 'days').format('YYYY-MM-DD');

        const payload = {
            amount: adjustmentAmount,
            type: isPositive ? 'Debit' : 'Credit',
            category: isPositive ? 'Receipt' : 'Drawing',
            date: adjustmentDate,
            notes: `Opening Balance Adjustment - Set to ${amount.toLocaleString('en-IN')}`
        };

        try {
            setLoading(true);
            await api.post('/payments/adjust', payload);
            toast.success('Opening Balance Updated!');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Adjustment failed:', error);
            toast.error(error.response?.data?.message || 'Failed to adjust balance');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const isPositive = difference > 0;
    const adjustmentLabel = isPositive ? 'Capital Injection' : 'Cash Correction/Drawing';
    const colorClass = isPositive ? 'text-emerald-600' : 'text-red-600';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl border border-gray-100 dark:border-gray-700">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-amber-500" />
                            Adjust Opening Balance
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Set your actual cash in hand</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Current System Balance */}
                    <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                        <span className="text-gray-500 dark:text-gray-400 font-medium">System Balance</span>
                        <span className={`text-lg font-bold ${currentBalance < 0 ? 'text-red-500' : 'text-gray-900 dark:text-gray-100'}`}>
                            ₹{currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                    </div>

                    {/* Actual Amount Input */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Actual Cash in Hand
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="text-gray-500 font-bold">₹</span>
                            </div>
                            <input
                                type="number"
                                step="any"
                                value={actualAmount}
                                onChange={handleAmountChange}
                                className="w-full pl-8 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-lg font-bold transition-all"
                                placeholder="Enter actual amount"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Difference Calculation */}
                    {actualAmount !== '' && difference !== 0 && (
                        <div className={`p-4 rounded-xl border ${isPositive ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                            <div className="flex items-start gap-3">
                                <Info className={`w-5 h-5 mt-0.5 ${colorClass}`} />
                                <div className="space-y-1">
                                    <p className={`font-semibold ${colorClass}`}>
                                        Adjustment: {isPositive ? '+' : ''}₹{Math.abs(difference).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                        System will record a <b>{adjustmentLabel}</b> of <span className="font-mono">₹{Math.abs(difference).toLocaleString('en-IN')}</span> to match your actual balance.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || actualAmount === ''}
                            className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Calculator className="w-4 h-4" />
                                    Confirm Adjustment
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdjustBalanceModal;
