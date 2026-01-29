import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from '../components/ConfirmationModal';
import { useAuth } from '../context/AuthContext';
import { useClientView } from '../context/ClientViewContext.jsx';
import Layout from '../components/Layout/Layout';
import CategoryManagementModal from '../components/CategoryManagementModal';
import api from '../utils/api';
import { formatINR } from '../utils/currency';
import {
    Package,
    Search,
    Plus,
    Edit2,
    Trash2,
    X,
    Upload,
    Download,
    FolderTree
} from 'lucide-react';
import toast from 'react-hot-toast';

const Inventory = () => {
    const navigate = useNavigate();
    const { isAdmin } = useAuth();
    const { isClientView } = useClientView();
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All Categories');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    const [categories, setCategories] = useState(['All Categories']);

    // Delete Confirmation State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);

    useEffect(() => {
        loadProducts();
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const { data } = await api.get('/categories?parent=null');
            setCategories(['All Categories', ...data.map(c => c.name)]);
        } catch (error) {
            console.error('Failed to load categories');
        }
    };

    useEffect(() => {
        let filtered = products;

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.imei1?.includes(searchQuery) ||
                p.imei2?.includes(searchQuery) ||
                p.serialNumber?.includes(searchQuery)
            );
        }

        // Category filter
        if (categoryFilter !== 'All Categories') {
            filtered = filtered.filter(p => p.category === categoryFilter);
        }

        setFilteredProducts(filtered);
    }, [searchQuery, categoryFilter, products]);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/products');
            setProducts(data);
            setFilteredProducts(data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to load products:', error);
            toast.error('Failed to load products');
            setLoading(false);
        }
    };

    const handleDeleteClick = (product) => {
        setProductToDelete(product);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!productToDelete) return;

        try {
            await api.delete(`/products/${productToDelete._id}`);
            toast.success('Product deleted successfully');
            loadProducts();
            setProductToDelete(null);
        } catch (error) {
            toast.error('Failed to delete product');
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setShowModal(true);
    };

    const handleAdd = () => {
        setEditingProduct(null);
        setShowModal(true);
    };

    const handleExport = () => {
        // Define headers
        const headers = ['Name', 'SKU', 'Category', 'Sub-Category', 'Selling Price', 'Stock', 'Min Stock Alert'];
        if (!isClientView) {
            headers.splice(4, 0, 'Cost Price');
        }

        // Map data to rows
        const rows = filteredProducts.map(p => {
            const row = [
                `"${p.name.replace(/"/g, '""')}"`, // Escape quotes
                `"${p.sku || ''}"`,
                `"${p.category || ''}"`,
                `"${p.subCategory || ''}"`,
                p.sellingPrice || 0,
                p.stock || 0,
                p.minStockAlert || 5
            ];

            if (!isClientView) {
                row.splice(4, 0, p.costPrice || 0);
            }

            return row;
        });

        // Combine headers and rows
        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const getStockColor = (stock) => {
        if (stock <= 5) return 'text-red-600 bg-red-50';
        if (stock <= 10) return 'text-yellow-600 bg-yellow-50';
        return 'text-green-600 bg-green-50';
    };

    return (
        <Layout>
            <div className="p-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inventory Management</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your product catalog</p>
                </div>

                {/* Toolbar */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6 border border-gray-100 dark:border-gray-700">
                    <div className="flex flex-col lg:flex-row items-center gap-4">
                        {/* Search */}
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name or SKU..."
                                className="w-full pl-12 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                            />
                        </div>

                        {/* Category Filter */}
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full lg:w-auto bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>

                        {/* Sub-Category Filter (Placeholder) */}
                        <select
                            className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full lg:w-auto bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option>All Sub-Categories</option>
                        </select>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 w-full lg:w-auto">
                            <button
                                onClick={() => setShowCategoryModal(true)}
                                className="flex items-center space-x-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                            >
                                <FolderTree className="w-4 h-4" />
                                <span className="text-sm font-medium">Manage Categories</span>
                            </button>

                            <button className="flex items-center space-x-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300">
                                <Upload className="w-4 h-4" />
                                <span className="text-sm font-medium">Import CSV</span>
                            </button>

                            <button
                                onClick={handleExport}
                                className="flex items-center space-x-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                            >
                                <Download className="w-4 h-4" />
                                <span className="text-sm font-medium">Export CSV</span>
                            </button>

                            <button
                                onClick={handleAdd}
                                className="flex items-center space-x-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="text-sm font-medium">Add Product</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Products Table */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                            <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className="text-lg">No products found. Add your first product to get started.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Image
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Product Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            SKU
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Category
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Sub-Category
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Selling Price
                                        </th>
                                        {isAdmin() && !isClientView && (
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Cost Price
                                            </th>
                                        )}
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Stock
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredProducts.map((product) => (
                                        <tr key={product._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-6 py-4">
                                                {product.image ? (
                                                    <img
                                                        src={product.image}
                                                        alt={product.name}
                                                        className="w-12 h-12 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                                        <Package className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                                                    {product.imei1 && (
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">IMEI: {product.imei1}</p>
                                                    )}
                                                    {product.serialNumber && (
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">S/N: {product.serialNumber}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                {product.sku || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                                {product.category}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                -
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white rupee">
                                                {formatINR(product.sellingPrice)}
                                            </td>
                                            {isAdmin() && !isClientView && (
                                                <td className="px-6 py-4 text-right text-sm text-gray-600 dark:text-gray-400 rupee">
                                                    {formatINR(product.costPrice)}
                                                </td>
                                            )}
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStockColor(product.stock)}`}>
                                                    {product.stock}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center space-x-2">
                                                    <button
                                                        onClick={() => handleEdit(product)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(product)}
                                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Product Modal */}
            {showModal && (
                <ProductModal
                    product={editingProduct}
                    onClose={() => {
                        setShowModal(false);
                        setEditingProduct(null);
                    }}
                    onSuccess={() => {
                        setShowModal(false);
                        setEditingProduct(null);
                        loadProducts();
                    }}
                />
            )}

            {/* Category Management Modal */}
            {showCategoryModal && (
                <CategoryManagementModal
                    onClose={() => {
                        setShowCategoryModal(false);
                        loadCategories();
                    }}
                />
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setProductToDelete(null);
                }}
                onConfirm={confirmDelete}
                title="Delete Product"
                message={`Are you sure you want to delete "${productToDelete?.name}"? This action cannot be undone.`}
                confirmText="Delete Product"
                isDangerous={true}
            />
        </Layout>
    );
};

// Product Modal Component
const ProductModal = ({ product, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: product?.name || '',
        sku: product?.sku || '',
        category: product?.category || '',
        subCategory: product?.subCategory || '',
        costPrice: product?.costPrice || '',
        margin: product?.margin || '',
        sellingPrice: product?.sellingPrice || '',
        stock: product?.stock || '',
        minStockAlert: product?.minStockAlert || 5, // Default 5
        gstPercent: product?.gstPercent || 18,
        imei1: product?.imei1 || '',
        imei2: product?.imei2 || '',
        serialNumber: product?.serialNumber || '',
        image: product?.image || '',
    });

    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    // Load categories on mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data } = await api.get('/categories?parent=null');
                setCategories(data);
            } catch (error) {
                console.error('Failed to load categories');
            }
        };
        fetchCategories();
    }, []);

    // Load sub-categories when category changes
    useEffect(() => {
        const fetchSubCategories = async () => {
            if (!formData.category) {
                setSubCategories([]);
                return;
            }

            // Find category ID
            const selectedCat = categories.find(c => c.name === formData.category);
            if (!selectedCat) return;

            try {
                const { data } = await api.get(`/categories/${selectedCat._id}`);
                setSubCategories(data.subCategories || []);
            } catch (error) {
                console.error('Failed to load sub-categories');
            }
        };
        fetchSubCategories();
    }, [formData.category, categories]);

    // Auto-calculate logic
    useEffect(() => {
        if (formData.costPrice && formData.margin) {
            const cp = parseFloat(formData.costPrice);
            const margin = parseFloat(formData.margin);
            const sp = cp + (cp * margin / 100);
            setFormData(prev => ({ ...prev, sellingPrice: sp.toFixed(2) }));
        }
    }, [formData.costPrice, formData.margin]);

    const handleSellingPriceChange = (e) => {
        const sp = parseFloat(e.target.value);
        setFormData(prev => ({ ...prev, sellingPrice: e.target.value }));

        if (formData.costPrice && sp) {
            const cp = parseFloat(formData.costPrice);
            const margin = ((sp - cp) / cp) * 100;
            setFormData(prev => ({ ...prev, margin: margin.toFixed(2) }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (product) {
                await api.put(`/products/${product._id}`, formData);
                toast.success('Product updated successfully');
            } else {
                await api.post('/products', formData);
                toast.success('Product added successfully');
            }
            onSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save product');
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData({ ...formData, image: reader.result });
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-gray-700">
                <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {product ? 'Edit Product' : 'Add New Product'}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Fill in the product details to add it to your inventory.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* Basic Details */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Product Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent transition-all outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                                placeholder="Enter product name"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">SKU</label>
                                <input
                                    type="text"
                                    value={formData.sku}
                                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent transition-all outline-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                                    placeholder="Auto-generated if empty"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value, subCategory: '' })}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent transition-all outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    required
                                >
                                    <option value="">Select category</option>
                                    {categories.map(cat => (
                                        <option key={cat._id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Sub-Category</label>
                                <select
                                    value={formData.subCategory}
                                    onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                                    className={`w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent transition-all outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${!formData.category ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={!formData.category}
                                >
                                    <option value="">Select sub-category</option>
                                    {subCategories.map(sub => (
                                        <option key={sub._id} value={sub.name}>{sub.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Cost Price (₹)</label>
                                <input
                                    type="number"
                                    value={formData.costPrice}
                                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent transition-all outline-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                                    placeholder="Enter cost price"
                                    required
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Margin (%)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={formData.margin}
                                        onChange={(e) => setFormData({ ...formData, margin: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent transition-all outline-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                                        placeholder="e.g., 20"
                                        step="0.1"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 font-medium">%</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Selling Price (₹)</label>
                                <input
                                    type="number"
                                    value={formData.sellingPrice}
                                    onChange={handleSellingPriceChange}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent transition-all outline-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                                    placeholder="Calculated automatically"
                                    required
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Current Stock</label>
                                <input
                                    type="number"
                                    value={formData.stock}
                                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent transition-all outline-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    required
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Min Stock Alert Level</label>
                                <input
                                    type="number"
                                    value={formData.minStockAlert}
                                    onChange={(e) => setFormData({ ...formData, minStockAlert: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent transition-all outline-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    min="0"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">GST Rate (%)</label>
                                <select
                                    value={formData.gstPercent}
                                    onChange={(e) => setFormData({ ...formData, gstPercent: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent transition-all outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value={0}>0% (Nil Rated)</option>
                                    <option value={5}>5%</option>
                                    <option value={12}>12%</option>
                                    <option value={18}>18% (Standard)</option>
                                    <option value={28}>28% (Luxury)</option>
                                </select>
                            </div>
                        </div>

                        {/* Category Specific Fields */}
                        {formData.category === 'Phone' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">IMEI 1</label>
                                    <input
                                        type="text"
                                        value={formData.imei1}
                                        onChange={(e) => setFormData({ ...formData, imei1: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent transition-all outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                                        placeholder="Enter IMEI 1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">IMEI 2</label>
                                    <input
                                        type="text"
                                        value={formData.imei2}
                                        onChange={(e) => setFormData({ ...formData, imei2: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent transition-all outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                                        placeholder="Enter IMEI 2"
                                    />
                                </div>
                            </div>
                        )}

                        {(formData.category === 'Watch' || formData.category === 'Audio') && (
                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Serial Number</label>
                                <input
                                    type="text"
                                    value={formData.serialNumber}
                                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent transition-all outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                                    placeholder="Enter Serial Number"
                                />
                            </div>
                        )}

                        {/* Image Upload */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Product Image (Optional)</label>
                            <div className="flex items-center gap-4">
                                <div className={`w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-700 ${!formData.image ? 'p-4' : ''}`}>
                                    {formData.image ? (
                                        <div className="relative w-full h-full group">
                                            <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, image: '' })}
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Remove Image"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-gray-400 dark:text-gray-500">
                                            <svg className="w-8 h-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors inline-flex items-center gap-2">
                                        <Upload className="w-4 h-4" />
                                        <span>Upload Image</span>
                                        <input
                                            type="file"
                                            onChange={handleImageUpload}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                    </label>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                        PNG, JPG, WEBP (max 5MB)<br />
                                        Auto-compressed to &lt;50KB for storage
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end space-x-4 pt-6 mt-6 border-t border-gray-100 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <span>{product ? 'Update Product' : 'Create Product'}</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Inventory;
