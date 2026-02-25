import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';

const GroupModal = ({ isOpen, onClose, onSuccess, groups = [] }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        parentGroup: '',
        nature: 'Assets',
        description: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post('/accounting/groups', formData);
            toast.success('Group created successfully');
            onSuccess();
            onClose();
            setFormData({ name: '', parentGroup: '', nature: 'Assets', description: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create group');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create Account Group</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Group Name *</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                            placeholder="e.g. Indirect Expenses"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Nature *</label>
                        <select
                            required
                            value={formData.nature}
                            onChange={(e) => setFormData({ ...formData, nature: e.target.value, parentGroup: '' })}
                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                            <option value="Assets">Assets</option>
                            <option value="Liabilities">Liabilities</option>
                            <option value="Income">Income</option>
                            <option value="Expenses">Expenses</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Parent Group (Optional)</label>
                        <select
                            value={formData.parentGroup}
                            onChange={(e) => setFormData({ ...formData, parentGroup: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                            <option value="">-- Primary (No Parent) --</option>
                            {groups
                                .filter(g => g.nature === formData.nature)
                                .map(g => (
                                    <option key={g._id} value={g._id}>{g.name}</option>
                                ))}
                        </select>
                        <p className="text-[10px] text-gray-400 mt-1">Select a parent group to create a sub-group.</p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                            rows="2"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {loading ? 'Saving...' : 'Save Group'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GroupModal;
