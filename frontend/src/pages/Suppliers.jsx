import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ConfirmationModal from '../components/ConfirmationModal';
import Layout from '../components/Layout/Layout';
import api from '../utils/api';
import { formatINR } from '../utils/currency';
import {
    TruckIcon,
    Search,
    Plus,
    Edit2,
    Trash2,
    X,
    Phone,
    Mail,
    IndianRupee,
    BookOpen
} from 'lucide-react';
import toast from 'react-hot-toast';

const Suppliers = () => {
    const navigate = useNavigate();
    const { isAdmin } = useAuth();
    const [suppliers, setSuppliers] = useState([]);
    const [filteredSuppliers, setFilteredSuppliers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [supplierToDelete, setSupplierToDelete] = useState(null);

    useEffect(() => {
        if (!isAdmin()) {
            navigate('/dashboard');
            toast.error('Access denied. Admin only.');
            return;
        }
        loadSuppliers();
    }, []);

    useEffect(() => {
        if (searchQuery) {
            const filtered = suppliers.filter(s =>
                s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.phone.includes(searchQuery) ||
                s.email?.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredSuppliers(filtered);
        } else {
            setFilteredSuppliers(suppliers);
        }
    }, [searchQuery, suppliers]);

    const loadSuppliers = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/suppliers');
            setSuppliers(data);
            setFilteredSuppliers(data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to load suppliers:', error);
            toast.error('Failed to load suppliers');
            setLoading(false);
        }
    };

    const handleDeleteClick = (supplier) => {
        setSupplierToDelete(supplier);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!supplierToDelete) return;

        try {
            await api.delete(`/suppliers/${supplierToDelete._id}`);
            toast.success('Supplier deleted successfully');
            loadSuppliers();
            setSupplierToDelete(null);
        } catch (error) {
            toast.error('Failed to delete supplier');
        }
    };

    const handleEdit = (supplier) => {
        setEditingSupplier(supplier);
        setShowModal(true);
    };

    const handleAdd = () => {
        setEditingSupplier(null);
        setShowModal(true);
    };

    return (
        <Layout>
            <div className="p-4 md:p-8 min-h-screen bg-gray-50/50 dark:bg-[#050505] transition-colors duration-500">
                {/* Header Section */}
                <div className="mb-10 relative">
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-amber-500/10 blur-[120px] rounded-full pointer-events-none"></div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                        <div>
                            <div className="flex items-center space-x-3 mb-2">
                                <div className="p-2 bg-amber-500/10 rounded-lg">
                                    <TruckIcon className="w-5 h-5 text-amber-500" />
                                </div>
                                <span className="text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-[0.3em]">Supply Network</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-500">Suppliers</span>
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium max-w-md">
                                Manage supplier information and payments
                            </p>
                        </div>
                        <button
                            onClick={handleAdd}
                            className="flex items-center space-x-2 px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl shadow-[0_20px_40px_rgba(217,119,6,0.2)] hover:shadow-[0_25px_50px_rgba(217,119,6,0.3)] transition-all duration-300 transform hover:-translate-y-1 group"
                        >
                            <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                            <span className="font-black tracking-tight text-lg">Add Supplier</span>
                        </button>
                    </div>
                </div>

                {/* Logistics Search Array */}
                <div className="mb-8 relative z-10">
                    <div className="bg-white/80 dark:bg-white/2 backdrop-blur-2xl p-2 rounded-[28px] border border-white dark:border-white/5 shadow-2xl shadow-amber-500/5">
                        <div className="relative group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by channel name, contact, or logistics ID..."
                                className="w-full pl-14 pr-6 py-4.5 bg-gray-50/50 dark:bg-white/5 border border-transparent focus:border-amber-500/30 rounded-[22px] text-gray-900 dark:text-white placeholder-gray-400 transition-all outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Acquisition Grid */}
                {loading ? (
                    <div className="bg-white/50 dark:bg-black/20 backdrop-blur-xl rounded-[32px] border border-white dark:border-white/5 p-20 text-center">
                        <div className="relative inline-block">
                            <div className="w-16 h-16 border-t-2 border-amber-500 rounded-full animate-spin mx-auto"></div>
                            <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full"></div>
                        </div>
                        <p className="mt-4 text-amber-600 dark:text-amber-400 font-bold tracking-widest uppercase text-xs animate-pulse font-mono">Loading Channels...</p>
                    </div>
                ) : filteredSuppliers.length === 0 ? (
                    <div className="bg-white/50 dark:bg-black/20 backdrop-blur-xl rounded-[32px] border border-white dark:border-white/5 p-20 text-center group">
                        <div className="relative inline-block mb-6">
                            <div className="absolute inset-0 bg-amber-500/10 blur-3xl rounded-full group-hover:bg-amber-500/20 transition-all duration-700"></div>
                            <TruckIcon className="w-20 h-20 text-amber-500/20 group-hover:text-amber-500/40 transition-all duration-500 relative z-10 mx-auto" strokeWidth={1} />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Channels Isolated</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">No procurement sources detected in the current sector.</p>
                        <button onClick={handleAdd} className="mt-8 px-8 py-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-xl hover:bg-amber-500 hover:text-white transition-all duration-300 font-bold uppercase tracking-widest text-xs">
                            Add Supplier
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                        {filteredSuppliers.map((supplier) => (
                            <div
                                key={supplier._id}
                                className="bg-white/50 dark:bg-black/20 backdrop-blur-xl rounded-[32px] border border-white dark:border-white/5 p-8 hover:bg-amber-500/[0.02] transition-all duration-500 shadow-xl shadow-black/5 group hover:-translate-y-2"
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center space-x-4">
                                        <div className="relative">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 font-black text-xl border border-amber-500/10 group-hover:scale-110 transition-transform duration-500 text-center leading-none">
                                                {supplier.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-white dark:border-[#0a0a0a]"></div>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                                {supplier.name}
                                            </h3>
                                            <div className="flex items-center space-x-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">
                                                <span>Source Code: {supplier._id.slice(-6).toUpperCase()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-8">
                                    <div className="flex items-center space-x-3 p-3 bg-gray-50/50 dark:bg-white/5 rounded-2xl border border-transparent group-hover:border-amber-500/10 transition-all duration-500">
                                        <div className="p-2 bg-amber-500/10 rounded-lg">
                                            <Phone className="w-4 h-4 text-amber-500" />
                                        </div>
                                        <span className="text-sm font-bold text-gray-600 dark:text-gray-300 tracking-tight">+91 {supplier.phone}</span>
                                    </div>
                                    {supplier.email && (
                                        <div className="flex items-center space-x-3 p-3 bg-gray-50/50 dark:bg-white/5 rounded-2xl border border-transparent group-hover:border-orange-500/10 transition-all duration-500">
                                            <div className="p-2 bg-orange-500/10 rounded-lg">
                                                <Mail className="w-4 h-4 text-orange-500" />
                                            </div>
                                            <span className="text-sm font-bold text-gray-600 dark:text-gray-300 tracking-tight truncate">{supplier.email}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="p-5 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-white/5 dark:to-transparent rounded-[24px] border border-white dark:border-white/5 group-hover:border-amber-500/20 transition-all duration-500 mb-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Liability Index</span>
                                        <IndianRupee className="w-3 h-3 text-gray-400" />
                                    </div>
                                    <div className={`text-2xl font-black rupee font-mono tracking-tighter ${supplier.balance > 0 ? 'text-emerald-600 dark:text-emerald-400' : supplier.balance < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                                        {formatINR(Math.abs(supplier.balance))}
                                    </div>
                                    <div className="flex items-center space-x-2 mt-2">
                                        <div className="h-1 flex-1 bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${supplier.balance > 0 ? 'bg-emerald-500' : supplier.balance < 0 ? 'bg-red-500' : 'bg-gray-400'}`}
                                                style={{ width: supplier.balance === 0 ? '0%' : '65%' }}
                                            ></div>
                                        </div>
                                        <span className={`text-[10px] font-bold ${supplier.balance > 0 ? 'text-emerald-500' : supplier.balance < 0 ? 'text-red-500' : 'text-gray-400'} uppercase`}>
                                            {supplier.balance > 0 ? 'Payable' : supplier.balance < 0 ? 'Receivable' : 'Neutral'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                                    <button
                                        onClick={() => navigate(`/suppliers/${supplier._id}/ledger`)}
                                        className="p-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/20 transition-all"
                                        title="Ledger"
                                    >
                                        <BookOpen className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleEdit(supplier)}
                                        className="p-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-lg shadow-amber-500/20 transition-all"
                                        title="Recalibrate"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(supplier)}
                                        className="p-3 bg-white dark:bg-white/5 text-red-500 hover:bg-red-500 hover:text-white rounded-xl border border-red-500/10 transition-all"
                                        title="Disconnect"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add/Edit Supplier Modal */}
            {showModal && (
                <SupplierModal
                    supplier={editingSupplier}
                    onClose={() => {
                        setShowModal(false);
                        setEditingSupplier(null);
                    }}
                    onSuccess={() => {
                        setShowModal(false);
                        setEditingSupplier(null);
                        loadSuppliers();
                    }}
                />
            )}

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setSupplierToDelete(null);
                }}
                onConfirm={confirmDelete}
                title="Delete Supplier"
                message={`Are you sure you want to delete "${supplierToDelete?.name}"? This action cannot be undone.`}
                confirmText="Delete Supplier"
                isDangerous={true}
            />
        </Layout>
    );
};

// Supplier Modal Component
const SupplierModal = ({ supplier, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: supplier?.name || '',
        phone: supplier?.phone || '',
        email: supplier?.email || '',
        address: supplier?.address || '',
        gstNumber: supplier?.gstNumber || '',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (supplier) {
                await api.put(`/suppliers/${supplier._id}`, formData);
                toast.success('Supplier updated successfully');
            } else {
                await api.post('/suppliers', formData);
                toast.success('Supplier added successfully');
            }
            onSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save supplier');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-100 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {supplier ? 'Edit Supplier' : 'Add New Supplier'}
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
                            Supplier Name *
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
                            value={formData.gstNumber}
                            onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                            placeholder="22AAAAA0000A1Z5"
                        />
                    </div>

                    <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
                            {loading ? 'Saving...' : supplier ? 'Update Supplier' : 'Add Supplier'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Suppliers;
