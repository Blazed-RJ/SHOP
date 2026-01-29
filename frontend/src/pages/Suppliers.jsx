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
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Suppliers</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage supplier information and payments</p>
                    </div>
                    <button
                        onClick={handleAdd}
                        className="flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow-sm transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Add Supplier</span>
                    </button>
                </div>

                {/* Search */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6 border border-gray-100 dark:border-gray-700">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name, phone, or email..."
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                        />
                    </div>
                </div>

                {/* Suppliers Grid */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    </div>
                ) : filteredSuppliers.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700">
                        <TruckIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">No suppliers found</p>
                        <button
                            onClick={handleAdd}
                            className="mt-4 text-blue-500 hover:text-blue-600 font-medium"
                        >
                            Add your first supplier
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredSuppliers.map((supplier) => (
                            <div
                                key={supplier._id}
                                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{supplier.name}</h3>
                                        <div className="flex items-center space-x-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                                            <Phone className="w-4 h-4" />
                                            <span>{supplier.phone}</span>
                                        </div>
                                        {supplier.email && (
                                            <div className="flex items-center space-x-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                                                <Mail className="w-4 h-4" />
                                                <span>{supplier.email}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {supplier.address && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{supplier.address}</p>
                                )}

                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Balance:</span>
                                        <span className={`text-lg font-bold rupee ${supplier.balance > 0 ? 'text-green-600 dark:text-green-400' : supplier.balance < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
                                            }`}>
                                            {formatINR(Math.abs(supplier.balance))}
                                        </span>
                                    </div>
                                    {supplier.balance > 0 && (
                                        <p className="text-xs text-green-600 dark:text-green-400">We owe supplier</p>
                                    )}
                                    {supplier.balance < 0 && (
                                        <p className="text-xs text-red-600 dark:text-red-400">Supplier owes us</p>
                                    )}
                                </div>

                                <div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <button
                                        onClick={() => navigate(`/suppliers/${supplier._id}/ledger`)}
                                        className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                                        title="View Ledger"
                                    >
                                        <BookOpen className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleEdit(supplier)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                        title="Edit"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(supplier)}
                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
        gstin: supplier?.gstin || '',
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
                            value={formData.gstin}
                            onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
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
