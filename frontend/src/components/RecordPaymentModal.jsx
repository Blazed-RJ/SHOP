import React, { useState, useEffect } from 'react';
import { X, Save, Building, User, Receipt, Calendar, Users } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const RecordPaymentModal = ({ isOpen, onClose, onSuccess, defaultDate, defaultTab = 'customer', variant = 'standard' }) => {
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
        name: '', // For Expense Name
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
            if (activeTab === 'supplier' || activeTab === 'expense') fetchSuppliers();
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
            let finalPartyId = formData.partyId;

            // --- CUSTOMER PAYMENT (IN) ---
            if (activeTab === 'customer') {
                if (!finalPartyId) return toast.error('Please select a customer');
                if (!amount || amount <= 0) return toast.error('Please enter a valid amount');

                await api.post('/payments', {
                    customerId: finalPartyId,
                    amount,
                    method: formData.paymentMode,
                    notes: formData.remarks,
                    date: formData.date
                });
            }
            // --- SUPPLIER/EXPENSE PAYMENT (OUT) ---
            else if (activeTab === 'supplier' || activeTab === 'expense') {

                // HANDLE NEW EXPENSE HEAD CREATION
                if (activeTab === 'expense' && formData.isNew) {
                    if (!formData.name) return toast.error('Please enter an expense name');

                    // 1. Create the new Expense Head (Supplier type 'Expense')
                    const { data: newSupplier } = await api.post('/suppliers', {
                        name: formData.name,
                        type: 'Expense',
                        phone: '0000000000', // Optional but safer to send dummy
                    });

                    finalPartyId = newSupplier._id;
                    // Optimistically add to list (optional but good for UX if we stayed open)
                    setSuppliers(prev => [...prev, newSupplier]);
                }

                if (!finalPartyId) return toast.error(`Please select a ${activeTab === 'expense' ? 'expense head' : 'supplier'}`);
                if (!amount || amount <= 0) return toast.error('Please enter a valid amount');

                // Both use the same endpoint now, distinguished by the ID's type in the backend
                await api.post('/payments/supplier', {
                    supplierId: finalPartyId,
                    amount,
                    method: formData.paymentMode,
                    notes: formData.remarks,
                    date: formData.date
                });
            }

            toast.success('Transaction Recorded!');
            if (onSuccess) onSuccess(); // Refresh Daybook
            if (activeTab === 'expense' && formData.isNew) {
                // Keep modal open or reset specific fields if rapid entry is needed?
                // For now, close standardized
            }
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
            name: '',
            date: defaultDate || new Date().toISOString().split('T')[0]
        });
        // Reset to default tab
        setActiveTab(defaultTab);
        onClose();
    };

    if (!isOpen) return null;

    // Filter suppliers for Expense Tab
    const expenseHeads = suppliers.filter(s => s.type === 'Expense');
    const regularSuppliers = suppliers.filter(s => s.type !== 'Expense');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
            <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-in border border-gray-100 dark:border-gray-700 ${variant === 'dedicated' ? '' : ''}`}>
                {/* Header */}
                <div className={`p-6 flex items-center justify-between bg-white dark:bg-gray-800 ${variant === 'dedicated' ? 'border-b-[2.5px] border-black dark:border-white/90' : 'border-b border-gray-100 dark:border-gray-700 p-4'}`}>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {activeTab === 'customer' ? 'Receive Payment' :
                            activeTab === 'expense' ? 'Record Expense' : 'Record Payment'}
                    </h2>
                    <button onClick={handleClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs - Hide if dedicated */}
                {variant !== 'dedicated' && (
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
                )}

                {/* Body */}
                <form onSubmit={handleSubmit} className={`space-y-4 ${variant === 'dedicated' ? 'p-6' : 'p-6 pt-2'}`}>

                    {/* Date Selection (Unified for All) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 w-5 h-5 text-gray-500" />
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none"
                            />
                        </div>
                    </div>

                    {/* CUSTOMER SELECT */}
                    {activeTab === 'customer' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Customer *</label>
                            <select
                                value={formData.partyId}
                                onChange={(e) => setFormData({ ...formData, partyId: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none transition-all"
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

                    {/* SUPPLIER SELECT (Filtered) */}
                    {activeTab === 'supplier' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Supplier *</label>
                            <select
                                value={formData.partyId}
                                onChange={(e) => setFormData({ ...formData, partyId: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none transition-all"
                            >
                                <option value="">Choose supplier...</option>
                                {regularSuppliers.map(s => (
                                    <option key={s._id} value={s._id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* EXPENSE HEAD SELECT (Filtered) */}
                    {activeTab === 'expense' && (
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {formData.isNew ? 'New Expense Name *' : 'Select Expense Head *'}
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setFormData(p => ({ ...p, isNew: !p.isNew, partyId: '', name: '' }))}
                                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                                >
                                    {formData.isNew ? 'Select Existing' : '+ Create New'}
                                </button>
                            </div>

                            {formData.isNew ? (
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none"
                                    placeholder="e.g. Office Rent"
                                    autoFocus
                                />
                            ) : (
                                <>
                                    <select
                                        value={formData.partyId}
                                        onChange={(e) => setFormData({ ...formData, partyId: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none transition-all"
                                    >
                                        <option value="">Choose expense head...</option>
                                        {expenseHeads.map(s => (
                                            <option key={s._id} value={s._id}>{s.name}</option>
                                        ))}
                                    </select>
                                    {expenseHeads.length === 0 && (
                                        <p className="text-[10px] text-red-500 mt-1">No expense heads found. Click '+ Create New' to add one.</p>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount *</label>
                        <input
                            type="number"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                        />
                    </div>

                    {/* Payment Mode */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Mode</label>
                        <select
                            value={formData.paymentMode}
                            onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none"
                        >
                            <option value="Cash">Cash</option>
                            <option value="UPI">UPI</option>
                            <option value="Card">Card</option>
                            <option value="Cheque">Cheque</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Online">Online</option>
                        </select>
                    </div>

                    {/* Remarks - Always Show */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Remarks (Optional)</label>
                        <input
                            type="text"
                            value={formData.remarks}
                            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none"
                            placeholder="Add a note..."
                        />
                    </div>

                    <div className={`flex items-center ${variant === 'dedicated' ? 'justify-end space-x-3 pt-4 border-t-[2.5px] border-black dark:border-white/90' : 'gap-3 pt-2'}`}>
                        <button
                            type="button"
                            onClick={handleClose}
                            className={`${variant === 'dedicated' ? 'px-6' : 'flex-1'} py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`${variant === 'dedicated' ? 'px-6' : 'flex-1'} py-2.5 text-white rounded-lg font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'customer'
                                ? 'bg-green-600 hover:bg-green-700 shadow-green-200 dark:shadow-none'
                                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 dark:shadow-none'
                                }`}
                        >
                            {loading ? 'Processing...' :
                                activeTab === 'customer' ? 'Receive Payment' :
                                    activeTab === 'expense' ? 'Record Expense' : 'Record Payment'}
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
};

export default RecordPaymentModal;
