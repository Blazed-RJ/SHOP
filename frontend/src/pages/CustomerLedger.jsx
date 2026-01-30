import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import api from '../utils/api';
import { formatINR } from '../utils/currency';
import { formatDate } from '../utils/date';
import { ArrowLeft, Download, RefreshCw, Printer, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const CustomerLedger = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState(null);
    const [ledger, setLedger] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [payment, setPayment] = useState({
        amount: '',
        method: 'Cash',
        notes: ''
    });

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [customerRes, ledgerRes] = await Promise.all([
                api.get(`/customers/${id}`),
                api.get(`/ledger/${id}`)
            ]);
            setCustomer(customerRes.data);
            setLedger(ledgerRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Error loading ledger:', error);
            toast.error('Failed to load ledger');
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleRecalculate = async () => {
        try {
            await api.post(`/ledger/recalculate/${id}`);
            toast.success('Ledger recalculated');
            loadData();
        } catch (error) {
            toast.error('Recalculation failed');
        }
    };

    const handleRecordPayment = async () => {
        if (!payment.amount || payment.amount <= 0) {
            return toast.error('Please enter a valid amount');
        }

        try {
            // Create payment via backend
            await api.post('/payments', {
                customerId: id,
                amount: parseFloat(payment.amount),
                method: payment.method,
                notes: payment.notes || 'Direct payment recorded'
            });

            toast.success('Payment recorded successfully');
            setShowPaymentModal(false);
            setPayment({ amount: '', method: 'Cash', notes: '' });
            loadData();
        } catch (error) {
            console.error('Payment error:', error);
            toast.error(error.response?.data?.message || 'Failed to record payment');
        }
    };

    return (
        <Layout>
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => navigate('/customers')}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {loading ? 'Loading...' : `${customer?.name} - Ledger`}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                {customer?.phone} | {customer?.address}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setShowPaymentModal(true)}
                            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Record Payment</span>
                        </button>
                        <button
                            onClick={handleRecalculate}
                            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span>Recalculate</span>
                        </button>
                        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            <Printer className="w-4 h-4" />
                            <span>Print Statement</span>
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Debit (Sales)</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400 rupee">
                            {formatINR(ledger.reduce((sum, entry) => sum + (entry.debit || 0), 0))}
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Credit (Received)</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400 rupee">
                            {formatINR(ledger.reduce((sum, entry) => sum + (entry.credit || 0), 0))}
                        </p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-6 rounded-xl shadow-sm border border-blue-100 dark:border-blue-800/50 transition-colors">
                        <p className="text-sm text-blue-800 dark:text-blue-300 mb-1">Net Balance Due</p>
                        <p className="text-3xl font-bold text-blue-700 dark:text-blue-400 rupee">
                            {formatINR(customer?.balance || 0)}
                        </p>
                    </div>
                </div>

                {/* Ledger Table */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700 transition-colors">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Particulars</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ref No</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-red-600 dark:text-red-400">Debit (Dr)</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-green-600 dark:text-green-400">Credit (Cr)</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-8">Loading ledger...</td>
                                    </tr>
                                ) : ledger.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-8 text-gray-500">No transactions found</td>
                                    </tr>
                                ) : (
                                    ledger.map((entry) => (
                                        <tr key={entry._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                                {formatDate(entry.date)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                                                <div className="font-medium">{entry.refType}</div>
                                                <div className="text-gray-500 dark:text-gray-400 text-xs">{entry.description}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono">
                                                {entry.refNo || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right font-medium text-red-600 dark:text-red-400">
                                                {entry.debit > 0 ? formatINR(entry.debit) : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right font-medium text-green-600 dark:text-green-400">
                                                {entry.credit > 0 ? formatINR(entry.credit) : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right font-bold text-gray-900 dark:text-white rupee bg-gray-50 dark:bg-gray-700/30">
                                                {formatINR(entry.balance)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Payment Recording Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-2xl transition-colors">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Record Payment</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Amount *
                                </label>
                                <input
                                    type="number"
                                    value={payment.amount}
                                    onChange={(e) => setPayment({ ...payment, amount: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                                    placeholder="Enter amount received"
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Payment Method *
                                </label>
                                <select
                                    value={payment.method}
                                    onChange={(e) => setPayment({ ...payment, method: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Credit">Credit</option>
                                    <option value="UPI">UPI</option>
                                    <option value="Card">Card</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    value={payment.notes}
                                    onChange={(e) => setPayment({ ...payment, notes: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                                    rows="3"
                                    placeholder="e.g., Payment for Invoice #123"
                                ></textarea>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRecordPayment}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                            >
                                Record Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default CustomerLedger;
