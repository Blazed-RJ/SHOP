import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';

const LedgerModal = ({ isOpen, onClose, onSuccess, groups = [], initialGroup = '' }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        group: initialGroup,
        openingBalance: 0,
        openingBalanceType: 'Dr',
        gstNumber: '',
        panNumber: '',
        mobile: '',
        email: '',
        address: ''
    });

    useEffect(() => {
        if (isOpen) {
            setFormData(prev => ({ ...prev, group: initialGroup || '' }));
        }
    }, [isOpen, initialGroup]);

    if (!isOpen) return null;


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post('/accounting/ledgers', {
                ...formData,
                openingBalance: Number(formData.openingBalance) || 0
            });
            toast.success('Ledger created successfully');
            onSuccess();
            onClose();
            setFormData({
                name: '', group: '', openingBalance: 0, openingBalanceType: 'Dr',
                gstNumber: '', panNumber: '', mobile: '', email: '', address: ''
            });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create ledger');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create Ledger Account</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="overflow-y-auto p-6 flex-1 custom-scrollbar">
                    <form id="ledger-form" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Ledger Name *</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                placeholder="e.g. HDFC Bank, Rent Account"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Under Group *</label>
                            <select
                                required
                                value={formData.group}
                                onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            >
                                <option value="">Select Group</option>
                                {groups.map(g => (
                                    <option key={g._id} value={g._id}>
                                        {g.name} ({g.nature})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4 bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                            <div>
                                <label className="block text-xs font-bold text-blue-800 dark:text-blue-300 mb-1">Opening Balance</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.openingBalance}
                                    onChange={(e) => setFormData({ ...formData, openingBalance: e.target.value })}
                                    className="w-full px-3 py-2 border border-blue-200 dark:border-blue-800 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-blue-800 dark:text-blue-300 mb-1">Dr / Cr</label>
                                <select
                                    value={formData.openingBalanceType}
                                    onChange={(e) => setFormData({ ...formData, openingBalanceType: e.target.value })}
                                    className="w-full px-3 py-2 border border-blue-200 dark:border-blue-800 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                >
                                    <option value="Dr">Dr (Debit)</option>
                                    <option value="Cr">Cr (Credit)</option>
                                </select>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Statutory & Mailing Details (Optional)</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">GST Number</label>
                                        <input
                                            type="text"
                                            value={formData.gstNumber}
                                            onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">PAN Number</label>
                                        <input
                                            type="text"
                                            value={formData.panNumber}
                                            onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Mobile</label>
                                        <input
                                            type="text"
                                            value={formData.mobile}
                                            onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Address</label>
                                    <textarea
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        rows="2"
                                    />
                                </div>
                            </div>
                        </div>

                    </form>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-white dark:hover:bg-gray-800"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="ledger-form"
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {loading ? 'Saving...' : 'Save Ledger'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LedgerModal;
