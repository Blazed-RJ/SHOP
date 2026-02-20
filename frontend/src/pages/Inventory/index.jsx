
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

// Components
import Header from './Header';
import FilterBar from './FilterBar';
import InventoryTable from './InventoryTable';
import InventoryCards from './InventoryCards';
import ProductForm from './ProductForm';
import ConfirmationModal from '../../components/ConfirmationModal';
import CategoryManagementModal from '../../components/CategoryManagementModal';

import CategoryFolderView from '../../components/Inventory/CategoryFolderView';
import Layout from '../../components/Layout/Layout';

const Inventory = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [showModal, setShowModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [categories, setCategories] = useState([]);
    const [stockFilter, setStockFilter] = useState('all'); // all, low, out
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

    // Folder View State
    const [viewMode, setViewMode] = useState('folder'); // 'folder' | 'list'
    const [categoryPath, setCategoryPath] = useState([]); // Array of {id, name}
    const [currentSubCategories, setCurrentSubCategories] = useState([]);

    // Debounce search query
    // In original code, useDebounce might not be imported from a hook file but defined inline or imported.
    // Checking original code imports...
    // import { Search, Plus, Edit2, Trash2, X, Filter, Download, ChevronDown, RefreshCw, Upload, Package, Layers, Tag, TrendingUp, ArrowUpDown, AlertCircle } from 'lucide-react';
    // import { formatINR } from '../utils/currency';
    // No useDebounce hook import found in original file view.
    // I will implement a simple debounce effect or just use the query directly if performance isn't critical yet,
    // or copy the debounce logic if it was there.
    // The original code had:
    // const debouncedSearch = useDebounce(searchQuery, 300);
    // So there IS a useDebounce hook. I should check where it comes from.
    // "import useDebounce from '../hooks/useDebounce';" - likely.

    // START OF DEBOUNCE IMPLEMENTATION IF HOOK MISSING
    // Actually, I'll assume the hook exists in ../hooks/useDebounce based on common patterns.
    // If not, I'll add a simple debounce here.
    const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    // Fetch Categories for Filter & Folder View
    const fetchCategories = async () => {
        try {
            const { data } = await api.get('/categories?parent=null');
            setCategories(data);
            // Initial load for folder view (root categories)
            if (categoryPath.length === 0) {
                setCurrentSubCategories(data);
            }
        } catch (error) {
            console.error('Failed to load categories', error);
        }
    };

    // Fetch Products
    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/products');
            setProducts(data.products || data); // Handle filtered response structure if API changes
        } catch (error) {
            console.error('Failed to fetch products', error);
            toast.error('Failed to load inventory');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, [fetchProducts]);


    // Folder View Logic
    const handleCategoryClick = async (category) => {
        setCategoryPath([...categoryPath, { id: category._id, name: category.name }]);
        setLoading(true);
        try {
            // Fetch sub-categories for the clicked category
            const { data } = await api.get(`/categories/${category._id}`);
            setCurrentSubCategories(data.subCategories || []);
        } catch (error) {
            console.error('Failed to load sub-categories', error);
            toast.error('Failed to load sub-categories');
            setCurrentSubCategories([]);
        } finally {
            setLoading(false);
        }
    };

    const handleNavigateBack = async (index = -1) => {
        if (index === -1) {
            // Go back one level
            if (categoryPath.length > 0) {
                const newPath = categoryPath.slice(0, -1);
                setCategoryPath(newPath);
                await loadFolderContent(newPath);
            }
        } else {
            // Go to specific level
            const newPath = categoryPath.slice(0, index + 1);
            setCategoryPath(newPath);
            await loadFolderContent(newPath);
        }
    };

    const handleNavigateHome = async () => {
        setCategoryPath([]);
        await loadFolderContent([]);
    };

    const loadFolderContent = async (path) => {
        setLoading(true);
        try {
            if (path.length === 0) {
                // Load root categories
                const { data } = await api.get('/categories?parent=null');
                setCurrentSubCategories(data);
            } else {
                // Load sub-categories of the last item in path
                const lastItem = path[path.length - 1];
                const { data } = await api.get(`/categories/${lastItem.id}`);
                setCurrentSubCategories(data.subCategories || []);
            }
        } catch (error) {
            console.error('Failed to load folder content', error);
            toast.error('Failed to update view');
        } finally {
            setLoading(false);
        }
    }


    // Delete Product
    const handleDeleteClick = (product) => {
        setProductToDelete(product);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!productToDelete) return;

        try {
            await api.delete(`/products/${productToDelete._id}`);
            toast.success('Product deleted successfully');
            fetchProducts();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete product');
        } finally {
            setProductToDelete(null);
        }
    };

    // Export to Excel
    const handleExport = () => {
        const exportData = products.map(p => ({
            Name: p.name,
            SKU: p.sku || '',
            Category: p.category,
            SubCategory: p.subCategory || '',
            SubSubCategory: p.subSubCategory || '',
            CostPrice: p.costPrice,
            SellingPrice: p.sellingPrice,
            Stock: p.stock,
            Value: p.stock * p.sellingPrice
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Inventory");
        XLSX.writeFile(wb, "Inventory_Report.xlsx");
    };

    // Sorting Logic
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Filtering & Sorting Logic
    const filteredProducts = useMemo(() => {
        let result = [...products];

        // 1. Search
        if (debouncedSearch) {
            const query = debouncedSearch.toLowerCase();
            result = result.filter(p =>
                p.name.toLowerCase().includes(query) ||
                (p.sku && p.sku.toLowerCase().includes(query)) ||
                (p.category && p.category.toLowerCase().includes(query))
            );
        }

        // 2. Category Filter (Sidebar/Dropdown)
        if (selectedCategory !== 'All') {
            result = result.filter(p => p.category === selectedCategory);
        }

        const hasActiveFilter = debouncedSearch || selectedCategory !== 'All' || stockFilter !== 'all';

        // 2.5 Folder View Filter (Overrides Sidebar if in folder mode)
        if (viewMode === 'folder') {
            if (!hasActiveFilter) {
                if (categoryPath.length === 0) {
                    // Root: do not show any products, only folders
                    result = [];
                } else if (categoryPath.length === 1) {
                    // Category level: only show products with this category, and NO subcategory
                    result = result.filter(p => p.category === categoryPath[0].name && (!p.subCategory || p.subCategory === ''));
                } else if (categoryPath.length === 2) {
                    // SubCategory level: only show products in this subCategory, and NO subSubCategory
                    result = result.filter(p => p.category === categoryPath[0].name && p.subCategory === categoryPath[1].name && (!p.subSubCategory || p.subSubCategory === ''));
                } else if (categoryPath.length >= 3) {
                    // SubSubCategory level: show products in this subSubCategory
                    result = result.filter(p => p.category === categoryPath[0].name && p.subCategory === categoryPath[1].name && p.subSubCategory === categoryPath[2].name);
                }
            } else {
                // If there are filters active, restrict to current path but show ALL nested matching products
                if (categoryPath.length > 0) {
                    result = result.filter(p => p.category === categoryPath[0].name);
                }
                if (categoryPath.length > 1) {
                    result = result.filter(p => p.subCategory === categoryPath[1].name);
                }
                if (categoryPath.length > 2) {
                    result = result.filter(p => p.subSubCategory === categoryPath[2].name);
                }
            }
        }


        // 3. Stock Filter
        if (stockFilter !== 'all') {
            if (stockFilter === 'low') {
                result = result.filter(p => p.stock <= (p.minStockAlert || 5) && p.stock > 0);
            } else if (stockFilter === 'out') {
                result = result.filter(p => p.stock === 0);
            }
        }

        // 4. Sorting
        result.sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });

        return result;
    }, [products, debouncedSearch, selectedCategory, stockFilter, sortConfig, viewMode, categoryPath]);

    // Filtered Folders
    const filteredFolders = useMemo(() => {
        let result = [...currentSubCategories];

        if (debouncedSearch) {
            const query = debouncedSearch.toLowerCase();
            result = result.filter(c => c.name.toLowerCase().includes(query));
        }

        if (selectedCategory !== 'All') {
            if (categoryPath.length === 0) {
                result = result.filter(c => c.name === selectedCategory);
            }
        }

        if (stockFilter !== 'all') {
            result = []; // Folders themselves don't have stock status in this view context
        }

        return result;
    }, [currentSubCategories, debouncedSearch, selectedCategory, stockFilter, categoryPath]);

    const totalValue = useMemo(() => {
        return products.reduce((sum, p) => sum + (p.stock * p.sellingPrice), 0);
    }, [products]);

    return (
        <Layout>
            <div className="p-8 relative space-y-6">
                <Header
                    totalProducts={products.length}
                    totalValue={totalValue}
                    onAddProduct={() => { setEditingProduct(null); setShowModal(true); }}
                    onExport={handleExport}
                    onManageCategories={() => setShowCategoryModal(true)}
                />

                <FilterBar
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                    stockFilter={stockFilter}
                    setStockFilter={setStockFilter}
                    categories={categories}
                    totalProducts={filteredProducts.length}
                    onRefresh={fetchProducts}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                />

                {viewMode === 'list' ? (
                    <>
                        <InventoryTable
                            products={filteredProducts}
                            loading={loading}
                            onEdit={(product) => { setEditingProduct(product); setShowModal(true); }}
                            onDelete={handleDeleteClick}
                            sortConfig={sortConfig}
                            onSort={handleSort}
                        />
                        <InventoryCards
                            products={filteredProducts}
                            loading={loading}
                            onEdit={(product) => { setEditingProduct(product); setShowModal(true); }}
                            onDelete={handleDeleteClick}
                        />
                    </>
                ) : (
                    <CategoryFolderView
                        categories={filteredFolders}
                        products={filteredProducts} // In folder view, filteredProducts is filtered by current path
                        currentPath={categoryPath}
                        onCategoryClick={handleCategoryClick}
                        onProductClick={(product) => { setEditingProduct(product); setShowModal(true); }}
                        onNavigateBack={() => handleNavigateBack(-1)}
                        onNavigateHome={handleNavigateHome}
                        loading={loading}
                    />
                )}

                {showModal && (
                    <ProductForm
                        product={editingProduct}
                        onClose={() => { setShowModal(false); setEditingProduct(null); }}
                        onSuccess={() => { setShowModal(false); fetchProducts(); }}
                    />
                )}

                {showCategoryModal && (
                    <CategoryManagementModal
                        onClose={() => { setShowCategoryModal(false); fetchCategories(); }}
                    />
                )}

                <ConfirmationModal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    onConfirm={confirmDelete}
                    title="Delete Product"
                    message={`Are you sure you want to delete "${productToDelete?.name}"? This action cannot be undone.`}
                    confirmText="Delete"
                    cancelText="Cancel"
                    isDangerous={true}
                />
            </div>
        </Layout>
    );
};

export default Inventory;
