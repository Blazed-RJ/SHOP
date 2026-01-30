import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useClientView } from '../context/ClientViewContext.jsx';
import Layout from '../components/Layout/Layout';
import api from '../utils/api';
import { formatINR } from '../utils/currency';
import {
    ShoppingCart,
    Package,
    IndianRupee,
    AlertCircle,
    TrendingUp,
    Users,
    FileText,
    Wallet,
    CreditCard
} from 'lucide-react';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isClientView } = useClientView();
    const [stats, setStats] = useState({
        totalParties: 0,
        totalItems: 0,
        totalSales: 0,
        totalInvoices: 0,
        cashCollection: 0,
        totalCollections: 0,
        totalReceivables: 0,
        recentInvoices: []
    });
    const [loading, setLoading] = useState(true);
    const [lowStockProducts, setLowStockProducts] = useState([]); // Keep this if it's still used later

    const { recentInvoices } = stats;

    const loadDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            const [productsRes, invoicesRes, customersRes] = await Promise.all([
                api.get('/products'),
                api.get('/invoices'),
                api.get('/customers'),
            ]);

            const products = productsRes.data;
            const invoices = invoicesRes.data;
            const customers = customersRes.data;

            // Calculate stats
            const today = new Date().toDateString();
            const todaysInvoices = invoices.filter(inv =>
                new Date(inv.createdAt).toDateString() === today
            );

            const todaySales = todaysInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
            const totalSales = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

            // Cash vs Online collection (today)
            const cashCollection = todaysInvoices.reduce((sum, inv) => {
                const cashPayment = inv.payments?.find(p => p.mode === 'Cash');
                return sum + (cashPayment?.amount || 0);
            }, 0);

            const onlineCollection = todaysInvoices.reduce((sum, inv) => {
                const upiPayment = inv.payments?.find(p => p.mode === 'UPI');
                const cardPayment = inv.payments?.find(p => p.mode === 'Card');
                const bankPayment = inv.payments?.find(p => p.mode === 'Bank Transfer');
                return sum + (upiPayment?.amount || 0) + (cardPayment?.amount || 0) + (bankPayment?.amount || 0);
            }, 0);

            // Credit/Udhaar (today's unpaid from today's invoices?)
            // Or total credit? Usually "Credit (Udhaar)" implies total outstanding or today's credit given.
            // Let's assume today's credit given for now based on context of "Today's Collection Breakdown"
            // But if it's "Credit (Udhaar)", it might mean how much credit was given TODAY.
            const creditUdhaar = todaysInvoices.reduce((sum, inv) => {
                // Check if fully paid? Or just grandTotal - paidAmount
                return sum + (inv.grandTotal - (inv.paidAmount || 0));
            }, 0);

            // Stock value and potential profit
            const totalStockValue = products.reduce((sum, p) => sum + ((p.costPrice || 0) * p.stock), 0);
            const potentialProfit = products.reduce((sum, p) =>
                sum + (((p.sellingPrice || 0) - (p.costPrice || 0)) * p.stock), 0
            );

            // Get low stock items (stock <= 5)
            const lowStock = products.filter(p => p.stock <= 5);

            setStats({
                totalParties: customers.length,
                totalItems: products.length,
                totalSales,
                totalInvoices: invoices.length,
                cashCollection,
                onlineCollection,
                todaySales,
                creditUdhaar,
                totalStockValue,
                potentialProfit,
                recentInvoices: invoices.slice(0, 5) // Most recent 5 (assuming sorted by backend or insert order)
            });

            setLowStockProducts(lowStock.slice(0, 10));
            setLoading(false);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Paid':
                return 'bg-green-100 text-green-700';
            case 'Partial':
                return 'bg-yellow-100 text-yellow-700';
            case 'Due':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-screen">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="p-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Welcome back, {user?.name}! Here's what's happening today.
                    </p>
                </div>

                {/* Top 4 Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    {/* Total Parties */}
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium opacity-90">Total Parties</p>
                                <p className="text-3xl font-bold mt-2">{stats.totalParties}</p>
                            </div>
                            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                                <Users className="w-8 h-8" />
                            </div>
                        </div>
                    </div>

                    {/* Total Items */}
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium opacity-90">Total Items</p>
                                <p className="text-3xl font-bold mt-2">{stats.totalItems}</p>
                            </div>
                            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                                <Package className="w-8 h-8" />
                            </div>
                        </div>
                    </div>

                    {/* Total Sales */}
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium opacity-90">Total Sales</p>
                                <p className="text-3xl font-bold mt-2 rupee">
                                    {formatINR(stats.totalSales)}
                                </p>
                            </div>
                            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                                <TrendingUp className="w-8 h-8" />
                            </div>
                        </div>
                    </div>

                    {/* Total Invoices */}
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium opacity-90">Total Invoices</p>
                                <p className="text-3xl font-bold mt-2">{stats.totalInvoices}</p>
                            </div>
                            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                                <FileText className="w-8 h-8" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Today's Collection Breakdown */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center">
                        <span className="mr-2">📊</span> Today's Collection Breakdown
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Cash Collection */}
                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/10 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
                            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">💵 Cash Collection</p>
                            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-300 mt-2 rupee">
                                {formatINR(stats.cashCollection)}
                            </p>
                        </div>

                        {/* Online (UPI) */}
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                            <p className="text-sm font-medium text-blue-700 dark:text-blue-400">💳 Online(UPI)</p>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-300 mt-2 rupee">
                                {formatINR(stats.onlineCollection)}
                            </p>
                        </div>

                        {/* Total Sale */}
                        <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-900/10 rounded-lg p-4 border border-pink-200 dark:border-pink-800">
                            <p className="text-sm font-medium text-pink-700 dark:text-pink-400">📈 Total Sale</p>
                            <p className="text-2xl font-bold text-pink-600 dark:text-pink-300 mt-2 rupee">
                                {formatINR(stats.todaySales)}
                            </p>
                        </div>

                        {/* Credit (Udhaar) */}
                        <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-900/10 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">💰 Credit (Udhaar)</p>
                            <p className="text-2xl font-bold text-amber-600 dark:text-amber-300 mt-2 rupee">
                                {formatINR(stats.creditUdhaar)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stock Value and Potential Profit */}
                {!isClientView && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* Total Stock Value */}
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-semibold">Total Stock Value</h3>
                                <Wallet className="w-6 h-6 opacity-80" />
                            </div>
                            <p className="text-xs opacity-80 mb-4">In current inventory</p>
                            <p className="text-4xl font-bold rupee">{formatINR(stats.totalStockValue)}</p>
                        </div>

                        {/* Potential Profit */}
                        <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-semibold">Potential Profit</h3>
                                <TrendingUp className="w-6 h-6 opacity-80" />
                            </div>
                            <p className="text-xs opacity-80 mb-4">On current inventory</p>
                            <p className="text-4xl font-bold rupee">{formatINR(stats.potentialProfit)}</p>
                        </div>
                    </div>
                )}

                {/* Recent Invoices and Low Stock Items */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Invoices */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Invoices</h2>
                            <button
                                onClick={() => navigate('/invoices')}
                                className="text-sm text-blue-500 hover:text-blue-600 font-medium"
                            >
                                View All
                            </button>
                        </div>
                        <div className="p-6">
                            {recentInvoices.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>No invoices yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {recentInvoices.map((invoice) => (
                                        <div
                                            key={invoice._id}
                                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                                            onClick={() => navigate(`/invoices`)}
                                        >
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">{invoice.invoiceNo}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {invoice.customer?.name || 'Walk-in'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-gray-900 dark:text-white rupee text-sm">
                                                    {formatINR(invoice.grandTotal)}
                                                </p>
                                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(invoice.status)}`}>
                                                    {invoice.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Low Stock Items */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                                <AlertCircle className="w-5 h-5 mr-2 text-orange-500" />
                                Low Stock Items
                            </h2>
                        </div>
                        <div className="p-6">
                            {lowStockProducts.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p className="text-green-600 dark:text-green-400 font-medium">All items are well stocked!</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-xs text-orange-600 dark:text-orange-400 mb-3">Items below minimum stock level</p>
                                    {lowStockProducts.map((product) => (
                                        <div
                                            key={product._id}
                                            className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-200 dark:border-orange-900/30"
                                        >
                                            <div className="flex items-center space-x-3">
                                                {product.image && (
                                                    <img
                                                        src={product.image}
                                                        alt={product.name}
                                                        className="w-10 h-10 rounded object-cover"
                                                    />
                                                )}
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white text-sm">{product.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{product.category}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                                                    {product.stock}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">in stock</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Dashboard;
