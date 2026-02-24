import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from '../components/ConfirmationModal';
import Layout from '../components/Layout/Layout';
import api from '../utils/api';
import { formatINR } from '../utils/currency';
import {
    Users,
    Search,
    Plus,
    Edit2,
    Trash2,
    BookOpen, // Ledger Icon
    Eye,
    X,
    Phone,
    IndianRupee
} from 'lucide-react';
import toast from 'react-hot-toast';

const Customers = () => {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState(null);


    const loadCustomers = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/customers');
            setCustomers(data.customers || []);
            setLoading(false);
        } catch (error) {
            console.error('Failed to load customers:', error);
            toast.error('Failed to load customers');
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadCustomers();
    }, [loadCustomers]);

    const filteredCustomers = React.useMemo(() => {
        if (!searchQuery) return customers;
        return customers.filter(c =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.phone.includes(searchQuery) ||
            c.email?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [customers, searchQuery]);

    const handleDeleteClick = (customer) => {
        setCustomerToDelete(customer);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!customerToDelete) return;

        try {
            await api.delete(`/customers/${customerToDelete._id}`);
            toast.success('Customer deleted successfully');
            loadCustomers();
            setCustomerToDelete(null);
        } catch (error) {
            console.error('Delete error:', error);
            toast.error(error.response?.data?.message || 'Failed to delete customer');
        }
    };

    const handleEdit = (customer) => {
        setEditingCustomer(customer);
        setShowModal(true);
    };

    const handleAdd = () => {
        setEditingCustomer(null);
        setShowModal(true);
    };

    return (
        <Layout>
            <div className="p-4 md:p-8 min-h-screen bg-gray-50/50 dark:bg-[#050505] transition-colors duration-500">
                {/* Header Section */}
                <div className="mb-10 relative">
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none"></div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                        <div>
                            <div className="flex items-center space-x-3 mb-2">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <Users className="w-5 h-5 text-blue-500" />
                                </div>
                                <span className="text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-[0.3em]">Relationship Hub</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-500">Customers</span>
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium max-w-md">
                                Manage customer information and ledgers
                            </p>
                        </div>
                        <button
                            onClick={handleAdd}
                            className="flex items-center space-x-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-[0_20px_40px_rgba(37,99,235,0.2)] hover:shadow-[0_25px_50px_rgba(37,99,235,0.3)] transition-all duration-300 transform hover:-translate-y-1 group"
                        >
                            <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                            <span className="font-black tracking-tight text-lg">Add Customer</span>
                        </button>
                    </div>
                </div>

                {/* Cognitive Search Bar */}
                <div className="mb-8 relative z-10 max-w-4xl mx-auto">
                    <div className="bg-white dark:bg-[#0a0a0a] p-2 rounded-2xl border border-blue-500/30 shadow-[0_4px_20px_-8px_rgba(59,130,246,0.3)] transition-all duration-300">
                        <div className="flex items-center px-4">
                            <Search className="w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name, phone, or digital ID..."
                                className="w-full pl-4 pr-4 py-3 bg-transparent border-none text-gray-900 dark:text-white placeholder-gray-400 focus:ring-0 text-sm font-medium"
                            />
                        </div>
                    </div>
                </div>

                {/* Partners Pulse Grid */}
                {loading ? (
                    <div className="bg-white/50 dark:bg-black/20 backdrop-blur-xl rounded-[32px] border border-white dark:border-white/5 p-20 text-center">
                        <div className="relative inline-block">
                            <div className="w-16 h-16 border-t-2 border-blue-500 rounded-full animate-spin mx-auto"></div>
                            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
                        </div>
                        <p className="mt-4 text-blue-600 dark:text-blue-400 font-bold tracking-widest uppercase text-xs animate-pulse font-mono">Syncing Directory...</p>
                    </div>
                ) : filteredCustomers.length === 0 ? (
                    <div className="bg-white/50 dark:bg-black/20 backdrop-blur-xl rounded-[32px] border border-white dark:border-white/5 p-20 text-center group">
                        <div className="relative inline-block mb-6">
                            <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full group-hover:bg-blue-500/20 transition-all duration-700"></div>
                            <Users className="w-20 h-20 text-blue-500/20 group-hover:text-blue-500/40 transition-all duration-500 relative z-10 mx-auto" strokeWidth={1} />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Hub Empty</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">No partners found matching your search matrix.</p>
                        <button onClick={handleAdd} className="mt-8 px-8 py-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-xl hover:bg-blue-500 hover:text-white transition-all duration-300 font-bold uppercase tracking-widest text-xs">
                            Add Customer
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                        {filteredCustomers.map((customer) => (
                            <div
                                key={customer._id}
                                className="bg-[#F8FAFF] dark:bg-[#0a0a0a] rounded-[32px] border-[1.5px] border-blue-400/40 p-6 shadow-sm hover:shadow-[0_8px_30px_-10px_rgba(59,130,246,0.2)] transition-all duration-300 group"
                            >
                                {/* Header Pill */}
                                <div className="border border-black/80 dark:border-white/80 rounded-full p-2 flex items-center gap-4 mb-4 bg-white dark:bg-black/40">
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg border border-blue-200 dark:border-blue-500/30">
                                            {customer.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-black rounded-full"></div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                                            {customer.name}
                                        </span>
                                        <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                            Level ID: {customer._id.slice(-6).toUpperCase()}
                                        </span>
                                    </div>
                                </div>

                                {/* Contact Pill */}
                                <div className="border border-black/80 dark:border-white/80 rounded-full px-5 py-3 mb-6 bg-white dark:bg-black/40 flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center">
                                        <Phone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300 tracking-wide">
                                        +91 {customer.phone}
                                    </span>
                                </div>

                                {/* Liability/Actions Container */}
                                <div className="border border-black/80 dark:border-white/80 rounded-2xl p-4 bg-gray-50/50 dark:bg-white/5 relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Credit Portfolio</span>
                                        <IndianRupee className="w-3 h-3 text-gray-300" />
                                    </div>

                                    <div className={`text-xl font-bold font-mono tracking-tighter mb-3 ${customer.balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                        {formatINR(Math.abs(customer.balance))}
                                    </div>

                                    <div className="flex items-center space-x-2 mb-2">
                                        <div className="h-1 flex-1 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${customer.balance > 0 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                                style={{ width: '40%' }}
                                            ></div>
                                        </div>
                                        <span className={`text-[9px] font-bold ${customer.balance > 0 ? 'text-red-500' : 'text-emerald-500'} uppercase`}>
                                            {customer.balance > 0 ? 'DUE' : 'CLEAR'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end space-x-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <button
                                        onClick={() => navigate(`/customers/${customer._id}/ledger`)}
                                        className="p-2 text-gray-400 hover:text-indigo-500 transition-colors"
                                        title="Ledger"
                                    >
                                        <BookOpen className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleEdit(customer)}
                                        className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                                        title="Modify"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(customer)}
                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                        title="Expunge"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add/Edit Customer Modal */}
            {showModal && (
                <CustomerModal
                    customer={editingCustomer}
                    onClose={() => {
                        setShowModal(false);
                        setEditingCustomer(null);
                    }}
                    onSuccess={() => {
                        setShowModal(false);
                        setEditingCustomer(null);
                        loadCustomers();
                    }}
                />
            )}

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setCustomerToDelete(null);
                }}
                onConfirm={confirmDelete}
                title="Delete Customer"
                message={`Are you sure you want to delete "${customerToDelete?.name}"? This action cannot be undone.`}
                confirmText="Delete Customer"
                isDangerous={true}
            />
        </Layout>
    );
};

// Customer Modal Component
const CustomerModal = ({ customer, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: customer?.name || '',
        phone: customer?.phone || '',
        email: customer?.email || '',
        address: customer?.address || '',
        gstin: customer?.gstin || '',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (customer) {
                await api.put(`/customers/${customer._id}`, formData);
                toast.success('Customer updated successfully');
            } else {
                await api.post('/customers', formData);
                toast.success('Customer added successfully');
            }
            onSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save customer');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-100 dark:border-gray-700">
                <div className="p-6 border-b-[2.5px] border-black dark:border-white/90 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {customer ? 'Edit Customer' : 'Add New Customer'}
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
                            Full Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Phone *
                        </label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Address
                        </label>
                        <textarea
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                            rows={3}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            GSTIN (Optional)
                        </label>
                        <input
                            type="text"
                            value={formData.gstin}
                            onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                            placeholder="22AAAAA0000A1Z5"
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
                            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : customer ? 'Update Customer' : 'Add Customer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Customers;
