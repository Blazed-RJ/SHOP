import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from '../components/ConfirmationModal';
import { useAuth } from '../context/AuthContext';
import { useClientView } from '../context/ClientViewContext.jsx';
import Layout from '../components/Layout/Layout';
import CategoryManagementModal from '../components/CategoryManagementModal';
import api from '../utils/api';
import { formatINR } from '../utils/currency';
import { debounce } from '../utils/debounce';
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
    const [subCategoryFilter, setSubCategoryFilter] = useState('All Sub-Categories');
    const [allCategories, setAllCategories] = useState([]);
    const [subCategories, setSubCategories] = useState(['All Sub-Categories']);
    const [allSubCategories, setAllSubCategories] = useState([]); // Store objects to find IDs
    const [subSubCategories, setSubSubCategories] = useState(['All Sub-Sub-Categories']);
    const [subSubCategoryFilter, setSubSubCategoryFilter] = useState('All Sub-Sub-Categories');

    // Delete Confirmation State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);

    const loadProducts = useCallback(async (currentSearch = searchQuery, currentCategory = categoryFilter, currentSubCategory = subCategoryFilter, currentSubSubCategory = subSubCategoryFilter) => {
        try {
            setLoading(true);

            // Build query parameters
            let url = '/products?limit=1000';
            if (currentSearch) url += `&search=${encodeURIComponent(currentSearch)}`;
            if (currentCategory && currentCategory !== 'All Categories') {
                url += `&category=${encodeURIComponent(currentCategory)}`;
            }
            if (currentSubCategory && currentSubCategory !== 'All Sub-Categories') {
                url += `&subCategory=${encodeURIComponent(currentSubCategory)}`;
            }
            if (currentSubSubCategory && currentSubSubCategory !== 'All Sub-Sub-Categories') {
                url += `&subSubCategory=${encodeURIComponent(currentSubSubCategory)}`;
            }

            const { data } = await api.get(url);
            setProducts(data.products || []);
            setFilteredProducts(data.products || []);
            setLoading(false);
        } catch (error) {
            console.error('Failed to load products:', error);
            toast.error('Failed to load products');
            setLoading(false);
        }
    }, [searchQuery, categoryFilter, subCategoryFilter, subSubCategoryFilter]);

    const loadCategories = useCallback(async () => {
        try {
            const { data } = await api.get('/categories?parent=null');
            setCategories(['All Categories', ...data.map(c => c.name)]);
            setAllCategories(data);
        } catch (error) {
            console.error('Failed to load categories', error);
        }
    }, []);

    useEffect(() => {
        loadProducts();
        loadCategories();
    }, [loadProducts, loadCategories]);

    // Definitions for category fetchers

    const fetchSubCategories = useCallback(async (catName) => {
        if (catName === 'All Categories') {
            setSubCategories(['All Sub-Categories']);
            setAllSubCategories([]);
            return;
        }

        const selectedCat = allCategories.find(c => c.name === catName);
        if (selectedCat) {
            try {
                const { data } = await api.get(`/categories/${selectedCat._id}`);
                if (data.subCategories && data.subCategories.length > 0) {
                    setSubCategories(['All Sub-Categories', ...data.subCategories.map(sub => sub.name)]);
                    setAllSubCategories(data.subCategories);
                } else {
                    setSubCategories(['All Sub-Categories']);
                    setAllSubCategories([]);
                }
            } catch (err) {
                console.error("Failed to load sub-categories for filter", err);
                setSubCategories(['All Sub-Categories']);
                setAllSubCategories([]);
            }
        }
    }, [allCategories]);

    const fetchSubSubCategories = useCallback(async (subCatName) => {
        console.log('[DEBUG] fetchSubSubCategories called with:', subCatName);
        console.log('[DEBUG] allSubCategories array:', allSubCategories);

        if (subCatName === 'All Sub-Categories') {
            setSubSubCategories(['All Sub-Sub-Categories']);
            return;
        }

        const selectedSubCat = allSubCategories.find(c => c.name === subCatName);
        console.log('[DEBUG] selectedSubCat found:', selectedSubCat);

        if (selectedSubCat) {
            try {
                console.log('[DEBUG] Fetching sub-sub-categories for ID:', selectedSubCat._id);
                const { data } = await api.get(`/categories/${selectedSubCat._id}`);
                console.log('[DEBUG] API response:', data);
                if (data.subCategories && data.subCategories.length > 0) {
                    const subSubNames = data.subCategories.map(sub => sub.name);
                    console.log('[DEBUG] Setting sub-sub-categories:', subSubNames);
                    setSubSubCategories(['All Sub-Sub-Categories', ...subSubNames]);
                } else {
                    console.log('[DEBUG] No sub-sub-categories found');
                    setSubSubCategories(['All Sub-Sub-Categories']);
                }
            } catch (err) {
                console.error("Failed to load sub-sub-categories for filter", err);
                setSubSubCategories(['All Sub-Sub-Categories']);
            }
        } else {
            console.warn('[DEBUG] selectedSubCat NOT FOUND in allSubCategories');
            console.warn('[DEBUG] Looking for:', subCatName);
            console.warn('[DEBUG] Available names:', allSubCategories.map(c => c.name));
        }
    }, [allSubCategories]);

    // Handle Category Filter Change
    useEffect(() => {
        setSubCategoryFilter('All Sub-Categories');
        setSubCategories(['All Sub-Categories']);
        // derived state reset
        setSubSubCategoryFilter('All Sub-Sub-Categories');
        setSubSubCategories(['All Sub-Sub-Categories']);

        fetchSubCategories(categoryFilter);
    }, [categoryFilter]); // Removed fetchSubCategories from dependencies to prevent loops

    // Handle Sub-Category Filter Change
    useEffect(() => {
        setSubSubCategoryFilter('All Sub-Sub-Categories');
        setSubSubCategories(['All Sub-Sub-Categories']);

        fetchSubSubCategories(subCategoryFilter);
    }, [subCategoryFilter]); // Removed fetchSubSubCategories from dependencies to prevent loops

    const refreshFilters = useCallback(() => {
        if (categoryFilter !== 'All Categories') {
            fetchSubCategories(categoryFilter);
        }
        if (subCategoryFilter !== 'All Sub-Categories') {
            fetchSubSubCategories(subCategoryFilter);
        }
    }, [categoryFilter, subCategoryFilter, fetchSubCategories, fetchSubSubCategories]);

    // Debounced search function
    const debouncedLoad = React.useCallback(
        debounce((search, cat, subCat, subSubCat) => {
            loadProducts(search, cat, subCat, subSubCat);
        }, 500),
        []
    );

    // Effect for search query changes
    useEffect(() => {
        debouncedLoad(searchQuery, categoryFilter, subCategoryFilter, subSubCategoryFilter);
    }, [searchQuery]);

    // Effect for category/sub-category changes (immediate)
    useEffect(() => {
        loadProducts(searchQuery, categoryFilter, subCategoryFilter, subSubCategoryFilter);
    }, [categoryFilter, subCategoryFilter, subSubCategoryFilter]);



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
        const headers = ['Name', 'SKU', 'Category', 'Sub-Category', 'Sub-Sub-Category', 'Selling Price', 'Stock', 'Min Stock Alert'];
        if (!isClientView) {
            headers.splice(5, 0, 'Cost Price');
        }

        // Map data to rows
        const rows = filteredProducts.map(p => {
            const row = [
                `"${p.name.replace(/"/g, '""')}"`, // Escape quotes
                `"${p.sku || ''}"`,
                `"${p.category || ''}"`,
                `"${p.subCategory || ''}"`,
                `"${p.subSubCategory || ''}"`,
                p.sellingPrice || 0,
                p.stock || 0,
                p.minStockAlert || 5
            ];

            if (!isClientView) {
                row.splice(5, 0, p.costPrice || 0);
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
            link.setAttribute('download', `inventory_export_${new Date().toLocaleDateString('en-CA')}.csv`);
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
            <div className="p-4 md:p-8 min-h-screen bg-gray-50/50 dark:bg-[#050505] transition-colors duration-500">
                {/* Header Section */}
                <div className="mb-10 relative">
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none"></div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                        <div>
                            <div className="flex items-center space-x-3 mb-2">
                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                    <Package className="w-5 h-5 text-emerald-500" />
                                </div>
                                <span className="text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-[0.3em]">Stock Explorer</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
                                Inventory <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Master</span>
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium max-w-md">
                                Real-time inventory tracking with advanced filtering and stock optimization.
                            </p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={handleExport}
                                className="group flex items-center space-x-2 px-5 py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl hover:border-emerald-500/30 transition-all duration-300"
                            >
                                <Download className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Export Registry</span>
                            </button>
                            <button
                                onClick={handleAdd}
                                className="flex items-center space-x-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-[0_10px_20px_rgba(16,185,129,0.2)] hover:shadow-[0_15px_25px_rgba(16,185,129,0.3)] transition-all duration-300 transform hover:-translate-y-0.5"
                            >
                                <Plus className="w-5 h-5" />
                                <span className="font-bold">Add Item</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Intelligent Filter Bar */}
                <div className="mb-8 relative z-10">
                    <div className="bg-white/80 dark:bg-white/2 backdrop-blur-2xl p-2 rounded-[24px] box-outline shadow-2xl shadow-emerald-500/5">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
                            {/* Search Engine */}
                            <div className="lg:col-span-5 relative group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by name, SKU or serial..."
                                    className="w-full pl-14 pr-6 py-4 bg-gray-50/50 dark:bg-white/5 border border-transparent focus:border-emerald-500/30 rounded-[18px] text-gray-900 dark:text-white placeholder-gray-400 transition-all outline-none"
                                />
                            </div>

                            {/* Category Navigator */}
                            <div className="lg:col-span-3 flex gap-2">
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="w-full px-6 py-4 bg-gray-50/50 dark:bg-white/5 border border-transparent focus:border-emerald-500/30 rounded-[18px] text-gray-900 dark:text-white transition-all outline-none appearance-none cursor-pointer"
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat} className="dark:bg-gray-900">{cat}</option>
                                    ))}
                                </select>
                                {categoryFilter !== 'All Categories' && subCategories.length > 1 && (
                                    <select
                                        value={subCategoryFilter}
                                        onChange={(e) => setSubCategoryFilter(e.target.value)}
                                        className="w-full px-6 py-4 bg-gray-50/50 dark:bg-white/5 border border-transparent focus:border-emerald-500/30 rounded-[18px] text-gray-900 dark:text-white transition-all outline-none appearance-none cursor-pointer animate-in fade-in slide-in-from-left-4 duration-300"
                                    >
                                        {subCategories.map(sub => (
                                            <option key={sub} value={sub} className="dark:bg-gray-900">{sub}</option>
                                        ))}
                                    </select>
                                )}
                                {categoryFilter !== 'All Categories' && subCategories.length > 1 && (
                                    <select
                                        value={subSubCategoryFilter}
                                        onChange={(e) => setSubSubCategoryFilter(e.target.value)}
                                        disabled={subCategoryFilter === 'All Sub-Categories'}
                                        className={`w-full px-6 py-4 bg-gray-50/50 dark:bg-white/5 border border-transparent focus:border-emerald-500/30 rounded-[18px] text-gray-900 dark:text-white transition-all outline-none appearance-none cursor-pointer animate-in fade-in slide-in-from-left-4 duration-300 ${subCategoryFilter === 'All Sub-Categories' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {subCategoryFilter === 'All Sub-Categories' ? (
                                            <option>Select Sub-Sub-Category</option>
                                        ) : subSubCategories.length <= 1 ? (
                                            <option>No Sub-Sub-Categories</option>
                                        ) : (
                                            subSubCategories.map(sub => (
                                                <option key={sub} value={sub} className="dark:bg-gray-900">{sub}</option>
                                            ))
                                        )}
                                    </select>
                                )}
                            </div>

                            {/* Management Actions */}
                            <div className="lg:col-span-4 flex items-center justify-end space-x-2 pr-2">
                                <button
                                    onClick={() => setShowCategoryModal(true)}
                                    className="p-4 bg-gray-50/50 dark:bg-white/5 text-gray-400 hover:text-emerald-500 hover:bg-emerald-500/5 rounded-[18px] transition-all"
                                    title="Schema Manager"
                                >
                                    <FolderTree className="w-5 h-5" />
                                </button>
                                <button
                                    className="p-4 bg-gray-50/50 dark:bg-white/5 text-gray-400 hover:text-emerald-500 hover:bg-emerald-500/5 rounded-[18px] transition-all"
                                    title="Bulk Interface"
                                >
                                    <Upload className="w-5 h-5" />
                                </button>
                                <div className="h-8 w-px bg-gray-200 dark:bg-white/10 mx-2"></div>
                                <div className="px-4 py-2 bg-emerald-500/10 rounded-full">
                                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">
                                        {filteredProducts.length} Results
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Optimized Registry Table */}
                <div className="relative z-10 transition-all duration-500">
                    {loading ? (
                        <div className="bg-white/50 dark:bg-black/20 backdrop-blur-xl rounded-[32px] box-outline p-20 text-center">
                            <div className="relative inline-block">
                                <div className="w-16 h-16 border-t-2 border-emerald-500 rounded-full animate-spin mx-auto"></div>
                                <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full"></div>
                            </div>
                            <p className="mt-4 text-emerald-600 dark:text-emerald-400 font-bold tracking-widest uppercase text-xs animate-pulse font-mono">Syncing Registry...</p>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="bg-white/50 dark:bg-black/20 backdrop-blur-xl rounded-[32px] box-outline p-20 text-center group">
                            <div className="relative inline-block mb-6">
                                <div className="absolute inset-0 bg-emerald-500/10 blur-3xl rounded-full group-hover:bg-emerald-500/20 transition-all duration-700"></div>
                                <Package className="w-20 h-20 text-emerald-500/20 group-hover:text-emerald-500/40 transition-all duration-500 relative z-10 mx-auto" strokeWidth={1} />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Vault Empty</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">No assets detected in the current filter scope.</p>
                            <button onClick={handleAdd} className="mt-8 px-8 py-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl hover:bg-emerald-500 hover:text-white transition-all duration-300 font-bold uppercase tracking-widest text-xs">
                                Add First Item
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white/50 dark:bg-black/20 backdrop-blur-xl rounded-[32px] box-outline overflow-hidden shadow-2xl shadow-black/5">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b-[2.5px] border-black dark:border-white/90">
                                            <th className="px-8 py-6 text-left text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">IMAGE</th>
                                            <th className="px-8 py-6 text-left text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">PRODUCT NAME</th>
                                            <th className="px-8 py-6 text-left text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">SKU</th>
                                            <th className="px-8 py-6 text-left text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">CATEGORY</th>
                                            <th className="px-8 py-6 text-left text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">SUB-CATEGORY</th>
                                            <th className="px-8 py-6 text-left text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">SUB-SUB CATEGORY</th>
                                            <th className="px-8 py-6 text-right text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">SELLING PRICE</th>
                                            {isAdmin() && !isClientView && (
                                                <th className="px-8 py-6 text-right text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">COST PRICE</th>
                                            )}
                                            <th className="px-8 py-6 text-center text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">STOCK</th>
                                            <th className="px-8 py-6 text-right text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-brand-500/80 dark:divide-brand-500/70">
                                        {filteredProducts.map((product) => (
                                            <tr key={product._id} className="group hover:bg-emerald-500/[0.02] transition-colors duration-300">
                                                <td className="px-8 py-5">
                                                    <div className="relative w-14 h-14">
                                                        {product.image ? (
                                                            <img
                                                                src={product.image}
                                                                alt={product.name}
                                                                className="w-full h-full rounded-2xl object-cover border border-gray-200 dark:border-white/10 group-hover:scale-110 transition-transform duration-500"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center border border-brand-500/80 dark:border-brand-500/70 group-hover:border-emerald-500/30 transition-all duration-500">
                                                                <Package className="w-6 h-6 text-gray-400 dark:text-gray-500 group-hover:text-emerald-500" />
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-0 rounded-2xl bg-emerald-500/20 blur opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <p className="text-base font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                                        {product.name}
                                                    </p>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex flex-col items-start gap-1">
                                                        <span className="text-[10px] font-mono font-black text-gray-400 dark:text-gray-500 uppercase tracking-tighter">
                                                            {product.sku || 'N/A'}
                                                        </span>
                                                        {product.imei1 && (
                                                            <span className="text-[9px] font-mono font-black text-emerald-600/60 dark:text-emerald-400/40 uppercase tracking-tighter bg-emerald-500/5 px-2 rounded">
                                                                IMEI SECURED
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100/50 dark:bg-emerald-500/10 border border-emerald-500/20 uppercase tracking-widest">
                                                        {product.category}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    {product.subCategory ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/5 border border-brand-500/80 dark:border-brand-500/70 uppercase tracking-wider">
                                                            {product.subCategory}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 dark:text-gray-600 text-[10px]">-</span>
                                                    )}
                                                </td>
                                                <td className="px-8 py-5">
                                                    {product.subSubCategory ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 uppercase tracking-wider">
                                                            {product.subSubCategory}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 dark:text-gray-600 text-[10px]">-</span>
                                                    )}
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <p className="text-lg font-black text-gray-900 dark:text-white rupee font-mono tracking-tighter">
                                                        {formatINR(product.sellingPrice)}
                                                    </p>
                                                </td>
                                                {isAdmin() && !isClientView && (
                                                    <td className="px-8 py-5 text-right">
                                                        <p className="text-base font-bold text-gray-500 dark:text-gray-400 rupee font-mono opacity-60">
                                                            {formatINR(product.costPrice)}
                                                        </p>
                                                    </td>
                                                )}
                                                <td className="px-8 py-5">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <div className={`text-xl font-black font-mono tracking-tighter ${product.stock <= product.minStockAlert ? 'text-red-500' :
                                                            product.stock <= product.minStockAlert * 2 ? 'text-amber-500' :
                                                                'text-emerald-500'
                                                            }`}>
                                                            {product.stock}
                                                        </div>
                                                        <div className="w-12 h-1 bg-gray-100 dark:bg-white/5 rounded-full mt-1 overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-1000 ${product.stock <= product.minStockAlert ? 'bg-red-500 w-1/4' :
                                                                    product.stock <= product.minStockAlert * 2 ? 'bg-amber-500 w-1/2' :
                                                                        'bg-emerald-500 w-full'
                                                                    }`}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <button
                                                            onClick={() => handleEdit(product)}
                                                            className="p-3 bg-gray-50/50 dark:bg-white/5 text-gray-400 hover:text-emerald-500 hover:bg-emerald-500/5 rounded-xl transition-all duration-300"
                                                            title="Edit Specifications"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(product)}
                                                            className="p-3 bg-gray-50/50 dark:bg-white/5 text-gray-400 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all duration-300"
                                                            title="Purge Entry"
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
        subSubCategory: product?.subSubCategory || '',
        costPrice: product?.costPrice || '',
        margin: product?.margin || '',
        sellingPrice: product?.sellingPrice || '',
        stock: product?.stock || '',
        minStockAlert: product?.minStockAlert ?? 5, // Default 5, allow 0
        gstPercent: product?.gstPercent || 18,
        imei1: product?.imei1 || '',
        imei2: product?.imei2 || '',
        serialNumber: product?.serialNumber || '',
        image: product?.image || '',
    });

    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [subSubCategories, setSubSubCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    // Load categories on mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data } = await api.get('/categories?parent=null');
                setCategories(data);
            } catch (error) {
                console.error('Failed to load categories', error);
            }
        };
        fetchCategories();
    }, []);

    // Load sub-categories when category changes
    useEffect(() => {
        const fetchSubCategories = async () => {
            if (!formData.category) {
                setSubCategories([]);
                setSubSubCategories([]);
                setFormData(prev => ({ ...prev, subCategory: '', subSubCategory: '' })); // Clear sub-category when main category is cleared
                return;
            }

            // Find category ID
            const selectedCat = categories.find(c => c.name === formData.category);
            if (!selectedCat) return;

            try {
                const { data } = await api.get(`/categories/${selectedCat._id}`);
                setSubCategories(data.subCategories || []);
            } catch (error) {
                console.error('Failed to load sub-categories', error);
                setSubCategories([]);
            }
        };
        fetchSubCategories();
    }, [formData.category, categories]);

    // Load sub-sub-categories when sub-category changes
    useEffect(() => {
        const fetchSubSubCategories = async () => {
            if (!formData.subCategory) {
                setSubSubCategories([]);
                setFormData(prev => ({ ...prev, subSubCategory: '' }));
                return;
            }

            // Find sub-category ID
            const selectedSubCat = subCategories.find(c => c.name === formData.subCategory);
            console.log('🔍 Selected sub-category:', formData.subCategory, 'Found:', selectedSubCat);
            if (!selectedSubCat) return;

            try {
                console.log('📡 Fetching sub-sub-categories for:', selectedSubCat._id);
                const { data } = await api.get(`/categories/${selectedSubCat._id}`);
                console.log('✅ Received data:', data);
                console.log('✅ Sub-sub-categories:', data.subCategories);
                setSubSubCategories(data.subCategories || []);
            } catch (error) {
                console.error('❌ Failed to load sub-sub-categories', error);
                setSubSubCategories([]);
            }
        };
        fetchSubSubCategories();
    }, [formData.subCategory, subCategories]);

    // Simplified Price Calculation Handlers
    const handleCostPriceChange = (e) => {
        const cp = e.target.value;
        setFormData(prev => {
            const newFormData = { ...prev, costPrice: cp };
            if (cp && prev.margin) {
                const sp = parseFloat(cp) + (parseFloat(cp) * parseFloat(prev.margin) / 100);
                newFormData.sellingPrice = sp.toFixed(2);
            }
            return newFormData;
        });
    };

    const handleMarginChange = (e) => {
        const margin = e.target.value;
        setFormData(prev => {
            const newFormData = { ...prev, margin: margin };
            if (prev.costPrice && margin) {
                const sp = parseFloat(prev.costPrice) + (parseFloat(prev.costPrice) * parseFloat(margin) / 100);
                newFormData.sellingPrice = sp.toFixed(2);
            }
            return newFormData;
        });
    };

    const handleSellingPriceChange = (e) => {
        const sp = e.target.value;
        setFormData(prev => {
            const newFormData = { ...prev, sellingPrice: sp };
            if (prev.costPrice && sp) {
                const cp = parseFloat(prev.costPrice);
                const margin = ((parseFloat(sp) - cp) / cp) * 100;
                newFormData.margin = margin.toFixed(2);
            }
            return newFormData;
        });
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
            refreshFilters(); // Refresh filters to show new categories if any
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check file size (max 50MB)
        if (file.size > 50 * 1024 * 1024) {
            toast.error('Image size should be less than 50MB');
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-brand-500/40 dark:border-brand-500/30">
                <div className="px-8 py-6 border-b border-brand-500/40 dark:border-brand-500/30 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
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
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value, subCategory: '', subSubCategory: '' })}
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

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Serial Number</label>
                            <input
                                type="text"
                                value={formData.serialNumber}
                                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent transition-all outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                                placeholder="Enter Serial Number"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Sub-Category</label>
                                <select
                                    value={formData.subCategory}
                                    onChange={(e) => setFormData({ ...formData, subCategory: e.target.value, subSubCategory: '' })}
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
                                {/* Sub-Sub-Category field - Third level of categorization */}
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Sub-Sub-Category</label>
                                <select
                                    value={formData.subSubCategory}
                                    onChange={(e) => setFormData({ ...formData, subSubCategory: e.target.value })}
                                    className={`w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent transition-all outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${!formData.subCategory || subSubCategories.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={!formData.subCategory || subSubCategories.length === 0}
                                >
                                    <option value="">Select sub-sub-category</option>
                                    {subSubCategories.map(subSub => (
                                        <option key={subSub._id} value={subSub.name}>{subSub.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Cost Price (₹)</label>
                                <input
                                    type="number"
                                    value={formData.costPrice}
                                    onChange={handleCostPriceChange}
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
                                        onChange={handleMarginChange}
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
