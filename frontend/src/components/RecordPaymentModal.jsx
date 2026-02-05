import React, { useState, useEffect } from 'react';
import { X, Save, Building, User, Receipt, Calendar, Users } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const RecordPaymentModal = ({ isOpen, onClose, onSuccess, defaultDate, defaultTab = 'customer' }) => {
    // Default to 'customer' if it's the most common action, or keep 'supplier' if preferred.
    // Changing default to 'customer' as "Record Payment" often means "Received Money".
    const [activeTab, setActiveTab] = useState(defaultTab);
    const [loading, setLoading] = useState(false);

    // Data Lists
    const [suppliers, setSuppliers] = useState([]);
    const [customers, setCustomers] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        partyId: '', // Shared for customer/supplier
        amount: '',
        paymentMode: 'Cash',
        sourceAccount: 'Cash Drawer', // Just UI context
        remarks: '',
        date: defaultDate || new Date().toISOString().split('T')[0]
    });

    // Reset on Open
    useEffect(() => {
        if (isOpen) {
            setActiveTab(defaultTab);

            // Sync date if provided
            if (defaultDate) {
                setFormData(prev => ({ ...prev, date: defaultDate }));
            }
        }
    }, [isOpen, defaultTab, defaultDate]);

    // Fetch Data on Tab Change
    useEffect(() => {
        if (isOpen) {
            if (activeTab === 'supplier') fetchSuppliers();
            if (activeTab === 'customer') fetchCustomers();
        }
    }, [isOpen, activeTab]);

    const fetchSuppliers = async () => {
        try {
            const { data } = await api.get('/suppliers');
            setSuppliers(data);
        } catch (error) {
            console.error('Failed to load suppliers', error);
        }
    };

    const fetchCustomers = async () => {
        try {
            const { data } = await api.get('/customers');
            // Customer API returns { customers: [], total: ... }
            setCustomers(data.customers || []);
        } catch (error) {
            console.error('Failed to load customers', error);
            // Fallback to empty array to prevent crash
            setCustomers([]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const amount = parseFloat(formData.amount);
            if (!amount || amount <= 0) {
                toast.error('Please enter a valid amount');
                setLoading(false);
                return;
            }

            // --- CUSTOMER PAYMENT (IN) ---
            if (activeTab === 'customer') {
                if (!formData.partyId) {
                    toast.error('Please select a customer');
                    setLoading(false);
                    return;
                }
                await api.post('/payments', {
                    customerId: formData.partyId,
                    amount,
                    method: formData.paymentMode,
                    notes: formData.remarks,
                    date: formData.date
                });
            }
            // --- SUPPLIER PAYMENT (OUT) ---
            else if (activeTab === 'supplier') {
                if (!formData.partyId) {
                    toast.error('Please select a supplier');
                    setLoading(false);
                    return;
                }
                await api.post('/payments/supplier', {
                    supplierId: formData.partyId,
                    amount,
                    method: formData.paymentMode,
                    notes: formData.remarks,
                    date: formData.date
                });
            }
            // --- EXPENSE (OUT) ---
            else {
                await api.post('/payments/expense', {
                    amount,
                    method: formData.paymentMode,
                    notes: formData.remarks,
                    category: 'Expense',
                    date: formData.date
                });
            }

            toast.success('Transaction Recorded!');
            onSuccess(); // Refresh Daybook
            handleClose();

        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to record transaction');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            partyId: '',
            amount: '',
            paymentMode: 'Cash',
            sourceAccount: 'Cash Drawer',
            remarks: '',
            date: defaultDate || new Date().toISOString().split('T')[0]
        });
        // Reset to default tab
        setActiveTab(defaultTab);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-in border border-gray-100 dark:border-gray-700">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                        {activeTab === 'customer' ? 'Receive Payment' :
                            activeTab === 'expense' ? 'Add New Expense' : 'Record Payment'}
                    </h2>
                    <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-1.5 bg-gray-50 dark:bg-gray-700/50 m-4 rounded-xl border border-gray-100 dark:border-gray-700 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => { setActiveTab('customer'); setFormData(p => ({ ...p, partyId: '' })); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all min-w-[90px] ${activeTab === 'customer'
                            ? 'bg-white dark:bg-gray-600 text-green-600 dark:text-green-400 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                    >
                        <Users className="w-4 h-4" /> Customer
                    </button>
                    <button
                        onClick={() => { setActiveTab('supplier'); setFormData(p => ({ ...p, partyId: '' })); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all min-w-[90px] ${activeTab === 'supplier'
                            ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                    >
                        <Building className="w-4 h-4" /> Supplier
                    </button>
                    {/* Drawing Tab Removed */}
                    <button
                        onClick={() => setActiveTab('expense')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all min-w-[90px] ${activeTab === 'expense'
                            ? 'bg-white dark:bg-gray-600 text-red-600 dark:text-red-400 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                    >
                        <Receipt className="w-4 h-4" /> Expense
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-4">

                    {/* Date Selection */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none"
                            />
                        </div>
                    </div>

                    {/* CUSTOMER SELECT */}
                    {activeTab === 'customer' && (
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Select Customer *</label>
                            <select
                                value={formData.partyId}
                                onChange={(e) => setFormData({ ...formData, partyId: e.target.value })}
                                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none transition-all"
                            >
                                <option value="">Choose customer...</option>
                                {customers.map(c => (
                                    <option key={c._id} value={c._id}>{c.name}</option>
                                ))}
                            </select>
                            {customers.length === 0 && (
                                <p className="text-[10px] text-green-500 mt-1">No customers found.</p>
                            )}
                        </div>
                    )}

                    {/* SUPPLIER SELECT */}
                    {activeTab === 'supplier' && (
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Select Supplier *</label>
                            <select
                                value={formData.partyId}
                                onChange={(e) => setFormData({ ...formData, partyId: e.target.value })}
                                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none transition-all"
                            >
                                <option value="">Choose supplier...</option>
                                {suppliers.map(s => (
                                    <option key={s._id} value={s._id}>{s.name}</option>
                                ))}
                            </select>
                            {suppliers.length === 0 && (
                                <p className="text-[10px] text-orange-500 mt-1">No suppliers found.</p>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Amount *</label>
                            <input
                                type="number"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none"
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Payment Mode</label>
                            <select
                                value={formData.paymentMode}
                                onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none"
                            >
                                <option value="Cash">Cash</option>
                                <option value="UPI">UPI</option>
                                <option value="Card">Card</option>
                                <option value="Cheque">Cheque</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                                <option value="Online">Online</option>
                            </select>
                        </div>
                    </div>

                    {/* Source Account Visual */}
                    {activeTab === 'customer' ? (
                        <div className="p-3 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-xl relative overflow-hidden">
                            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-green-800 dark:text-green-500">
                                <span className="text-lg">📥</span> Money In: Where is it going?
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                                Adding <span className="font-bold text-gray-900 dark:text-white">{formData.paymentMode}</span> payment from Customer.
                                <br />Increases Cash/Bank Balance.
                            </div>
                        </div>
                    ) : (
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-xl relative overflow-hidden">
                            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-amber-800 dark:text-amber-500">
                                <span className="text-lg">📤</span> Money Out: Source Account
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div
                                    onClick={() => setFormData({ ...formData, sourceAccount: 'Cash Drawer' })}
                                    className={`p-2 rounded-lg border cursor-pointer transition-all ${formData.paymentMode === 'Cash'
                                        ? 'bg-white dark:bg-gray-800 border-blue-500 dark:border-blue-500 shadow-sm ring-1 ring-blue-500'
                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-50'
                                        }`}
                                >
                                    <div className="font-semibold text-gray-800 dark:text-white text-sm">Cash Drawer</div>
                                    <div className="text-[10px] text-gray-500 dark:text-gray-400">Reduces Cash in Hand</div>
                                </div>
                                <div
                                    onClick={() => setFormData({ ...formData, sourceAccount: 'Bank' })}
                                    className={`p-2 rounded-lg border cursor-pointer transition-all ${formData.paymentMode !== 'Cash'
                                        ? 'bg-white dark:bg-gray-800 border-blue-500 dark:border-blue-500 shadow-sm ring-1 ring-blue-500'
                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-50'
                                        }`}
                                >
                                    <div className="font-semibold text-gray-800 dark:text-white text-sm">Bank / UPI</div>
                                    <div className="text-[10px] text-gray-500 dark:text-gray-400">Reduces Bank Balance</div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Remarks (Optional)</label>
                        <input
                            type="text"
                            value={formData.remarks}
                            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none"
                            placeholder="Add a note..."
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex-1 py-2.5 text-white rounded-lg font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'customer'
                                ? 'bg-green-600 hover:bg-green-700 shadow-green-200 dark:shadow-none'
                                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 dark:shadow-none'
                                }`}
                        >
                            {loading ? 'Recording...' :
                                activeTab === 'customer' ? 'Receive Payment' :
                                    activeTab === 'expense' ? 'Add Expense' : 'Record Supplier Payment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RecordPaymentModal;
