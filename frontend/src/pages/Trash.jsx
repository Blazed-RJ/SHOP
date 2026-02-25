import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout/Layout';
import api from '../utils/api';
import {
    Trash2,
    RefreshCw,
    Package,
    Users,
    TruckIcon,
    FileText,
    Clock,
    Search
} from 'lucide-react';
import toast from 'react-hot-toast';

const Trash = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('products');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const tabs = [
        { id: 'products', name: 'Products', icon: Package, endpoint: '/products/trash' },
        { id: 'customers', name: 'Customers', icon: Users, endpoint: '/customers/trash' },
        { id: 'suppliers', name: 'Suppliers', icon: TruckIcon, endpoint: '/suppliers/trash' },
        { id: 'invoices', name: 'Invoices', icon: FileText, endpoint: '/invoices/trash' }
    ];

    const loadItems = useCallback(async () => {
        try {
            setLoading(true);
            const activeTabData = tabs.find(t => t.id === activeTab);
            const { data } = await api.get(activeTabData.endpoint);

            // Extract array based on resource
            let dataArray = [];
            if (activeTab === 'products') dataArray = data.products || [];
            if (activeTab === 'customers') dataArray = data.customers || [];
            if (activeTab === 'suppliers') dataArray = data.suppliers || [];
            if (activeTab === 'invoices') dataArray = data.invoices || [];

            setItems(dataArray);
            setLoading(false);
        } catch (error) {
            console.error('Failed to load trash items:', error);
            toast.error(`Failed to load deleted ${activeTab}`);
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        loadItems();
    }, [loadItems]);

    const handleRestore = async (id) => {
        try {
            await api.put(`/${activeTab}/${id}/restore`);
            toast.success('Item restored successfully');
            loadItems();
        } catch (error) {
            console.error('Restore error:', error);
            toast.error(error.response?.data?.message || 'Failed to restore item');
        }
    };

    const handleHardDelete = async (id) => {
        if (!window.confirm('Are you sure you want to permanently delete this item? This action cannot be undone.')) {
            return;
        }
        try {
            await api.delete(`/${activeTab}/${id}/hard-delete`);
            toast.success('Item permanently deleted');
            loadItems();
        } catch (error) {
            console.error('Hard delete error:', error);
            toast.error(error.response?.data?.message || 'Failed to delete item permanently');
        }
    };

    const filteredItems = React.useMemo(() => {
        if (!searchQuery) return items;
        return items.filter(item => {
            const searchStr = searchQuery.toLowerCase();
            if (activeTab === 'products') return item.name?.toLowerCase().includes(searchStr) || item.sku?.toLowerCase().includes(searchStr);
            if (activeTab === 'customers' || activeTab === 'suppliers') return item.name?.toLowerCase().includes(searchStr) || item.phone?.includes(searchStr);
            if (activeTab === 'invoices') return item.invoiceNo?.toLowerCase().includes(searchStr) || item.customerName?.toLowerCase().includes(searchStr);
            return false;
        });
    }, [items, searchQuery, activeTab]);

    const getPrimaryText = (item) => {
        if (activeTab === 'products') return item.name;
        if (activeTab === 'customers' || activeTab === 'suppliers') return item.name;
        if (activeTab === 'invoices') return `Invoice #${item.invoiceNo}`;
        return 'Unknown';
    };

    const getSecondaryText = (item) => {
        if (activeTab === 'products') return `SKU: ${item.sku}`;
        if (activeTab === 'customers' || activeTab === 'suppliers') return item.phone || item.email;
        if (activeTab === 'invoices') return item.customerName;
        return '';
    };

    return (
        <Layout>
            <div className="p-4 md:p-8 min-h-screen bg-gray-50/50 dark:bg-[#050505] transition-colors duration-500">
                {/* Header Sequence */}
                <div className="mb-10 relative">
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-red-500/10 blur-[120px] rounded-full pointer-events-none"></div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                        <div>
                            <div className="flex items-center space-x-3 mb-2">
                                <div className="p-2 bg-red-500/10 rounded-lg">
                                    <Trash2 className="w-5 h-5 text-red-500" />
                                </div>
                                <span className="text-red-600 dark:text-red-400 text-xs font-black uppercase tracking-[0.3em]">System Recovery</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
                                Recycle <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-400">Bin</span>
                            </h1>
                            <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium max-w-xl">
                                Restore accidentally deleted records. Items here have been soft-deleted and can be recovered with all their relationships intact.
                            </p>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="relative group flex-1 md:w-80">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    placeholder={`Search deleted ${activeTab}...`}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all dark:text-white shadow-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex overflow-x-auto hide-scrollbar space-x-2 mb-6 bg-white dark:bg-zinc-900/50 p-2 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm relative z-10">
                    {tabs.map((tab) => {
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }}
                                className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all whitespace-nowrap font-medium ${active
                                    ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                                    }`}
                            >
                                <tab.icon className={`w-4 h-4 ${active ? 'text-white' : ''}`} />
                                <span>{tab.name}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Data List */}
                <div className="bg-white dark:bg-zinc-900/40 rounded-3xl border border-gray-200 dark:border-zinc-800/80 shadow-xl overflow-hidden backdrop-blur-xl relative z-10">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <RefreshCw className="w-8 h-8 text-red-500 animate-spin" />
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                            <div className="w-20 h-20 mb-6 bg-gray-100 dark:bg-zinc-800/50 rounded-full flex items-center justify-center">
                                <Trash2 className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No items found</h3>
                            <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                                The {activeTab} recycle bin is currently empty or no items match your search.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 dark:bg-zinc-800/30 border-b border-gray-100 dark:border-zinc-800">
                                        <th className="py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Item Details</th>
                                        <th className="py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Deleted At</th>
                                        <th className="py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/50">
                                    {filteredItems.map((item) => (
                                        <tr key={item._id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/20 transition-colors group">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                                        {activeTab === 'products' && <Package className="w-5 h-5 text-gray-500" />}
                                                        {activeTab === 'customers' && <Users className="w-5 h-5 text-gray-500" />}
                                                        {activeTab === 'suppliers' && <TruckIcon className="w-5 h-5 text-gray-500" />}
                                                        {activeTab === 'invoices' && <FileText className="w-5 h-5 text-gray-500" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-red-500 transition-colors">
                                                            {getPrimaryText(item)}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                            {getSecondaryText(item)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-300">
                                                <div className="flex items-center space-x-2">
                                                    <Clock className="w-4 h-4 text-gray-400" />
                                                    <span>{new Date(item.deletedAt || item.updatedAt).toLocaleString()}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button
                                                        onClick={() => handleRestore(item._id)}
                                                        className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                                                    >
                                                        <RefreshCw className="w-4 h-4" />
                                                        <span>Restore</span>
                                                    </button>
                                                    {user?.role === 'Admin' && (
                                                        <button
                                                            onClick={() => handleHardDelete(item._id)}
                                                            className="inline-flex items-center space-x-2 px-4 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-medium rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                                                            title="Permanently Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
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
        </Layout>
    );
};

export default Trash;
