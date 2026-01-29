import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import api from '../utils/api';
import { formatINR } from '../utils/currency';
import { formatDate } from '../utils/date';
import {
    FileText,
    Search,
    Filter,
    Download,
    Eye,
    Trash2,
    Plus
} from 'lucide-react';
import toast from 'react-hot-toast';

const InvoiceHistory = () => {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState([]);
    const [filteredInvoices, setFilteredInvoices] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [loading, setLoading] = useState(true);

    // Void Modal State
    const [showVoidModal, setShowVoidModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [voidReason, setVoidReason] = useState('');

    useEffect(() => {
        loadInvoices();
    }, []);

    useEffect(() => {
        let filtered = invoices;

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(inv =>
                inv.invoiceNo.toLowerCase().includes(query) ||
                (inv.customer?.name || inv.customerName || '').toLowerCase().includes(query) ||
                (inv.customer?.phone || inv.customerPhone || '').includes(query) ||
                // Search by IMEI (1 or 2) or Serial
                inv.items?.some(item =>
                    item.imei?.toLowerCase().includes(query) ||
                    item.imei2?.toLowerCase().includes(query) ||
                    item.serialNumber?.toLowerCase().includes(query)
                )
            );
        }

        // Status filter
        if (statusFilter !== 'All') {
            filtered = filtered.filter(inv => inv.status === statusFilter);
        }

        setFilteredInvoices(filtered);
    }, [searchQuery, statusFilter, invoices]);

    const loadInvoices = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/invoices');
            setInvoices(data);
            setFilteredInvoices(data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to load invoices:', error);
            toast.error('Failed to load invoices');
            setLoading(false);
        }
    };

    const handleVoidClick = (invoice) => {
        setSelectedInvoice(invoice);
        setVoidReason(''); // We can keep reason for our own tracking if we add 'reason' to delete endpoint later, but for now standard delete.
        setShowVoidModal(true);
    };

    const confirmDelete = async () => {
        try {
            // Hard Delete API Call
            const res = await api.delete(`/invoices/${selectedInvoice._id}`);
            // alert('Response: ' + JSON.stringify(res.data)); // Optional Debug
            toast.success('Invoice deleted successfully');
            setShowVoidModal(false);
            loadInvoices();
        } catch (error) {
            console.error('Delete error:', error);
            const msg = error.response?.data?.message || 'Failed to delete invoice';
            toast.error(msg);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Paid':
                return 'bg-green-100 text-green-700';
            case 'Partial':
                return 'bg-yellow-100 text-yellow-700';
            case 'Due':
                return 'bg-red-100 text-red-700';
            case 'Void':
                return 'bg-gray-200 text-gray-500 line-through';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <Layout>
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Invoice History</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">View and manage all invoices</p>
                    </div>
                    <button
                        onClick={() => navigate('/invoice/new')}
                        className="flex items-center space-x-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        <span>New Invoice</span>
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by invoice number, customer name, or phone..."
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="relative">
                            <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option>All</option>
                                <option>Paid</option>
                                <option>Partial</option>
                                <option>Due</option>
                                <option>Void</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Invoices Table */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                        </div>
                    ) : filteredInvoices.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className="text-lg">No invoices found</p>
                            {searchQuery || statusFilter !== 'All' ? (
                                <p className="text-sm mt-2">Try adjusting your filters</p>
                            ) : (
                                <button
                                    onClick={() => navigate('/invoice/new')}
                                    className="mt-4 text-blue-500 hover:text-blue-400 font-medium"
                                >
                                    Create your first invoice
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Invoice No
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Customer
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Amount
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Paid
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredInvoices.map((invoice) => (
                                        <tr key={invoice._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900 dark:text-white">{invoice.invoiceNo}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{invoice.invoiceType}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900 dark:text-white">
                                                    {invoice.customer?.name || invoice.customerName || 'Walk-in Customer'}
                                                </div>
                                                {invoice.customer?.phone && (
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">{invoice.customer.phone}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                                {formatDate(invoice.invoiceDate || invoice.createdAt)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white rupee">
                                                {formatINR(invoice.grandTotal)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm text-gray-600 dark:text-gray-300 rupee">
                                                {formatINR(invoice.paidAmount)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(invoice.status)}`}>
                                                    {invoice.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center space-x-2">
                                                    <button
                                                        onClick={() => navigate(`/invoice/${invoice._id}`)}
                                                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                        title="View"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => window.print()}
                                                        className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                                                        title="Print"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleVoidClick(invoice)}
                                                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                        title="Delete Permanently"
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

                {/* Summary Stats */}
                {!loading && filteredInvoices.length > 0 && (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Invoices</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredInvoices.length}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white rupee">
                                {formatINR(filteredInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0))}
                            </p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Paid</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400 rupee">
                                {formatINR(filteredInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0))}
                            </p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Due</p>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400 rupee">
                                {formatINR(filteredInvoices.reduce((sum, inv) => sum + (inv.grandTotal - inv.paidAmount), 0))}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {showVoidModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Delete Invoice {selectedInvoice?.invoiceNo}</h3>

                        <div className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 border p-4 rounded-lg mb-6">
                            <p className="text-sm text-red-800 dark:text-red-300 font-medium mb-2">
                                Critical Warning: This will PERMANENTLY remove the invoice.
                            </p>
                            <ul className="list-disc pl-5 text-sm text-red-700 dark:text-red-400 space-y-1">
                                <li>Items will be restored to inventory.</li>
                                <li>Customer balance will be reverted.</li>
                                <li>Record will be gone forever.</li>
                            </ul>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowVoidModal(false)}
                                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-sm transition-colors"
                            >
                                Confirm Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default InvoiceHistory;
