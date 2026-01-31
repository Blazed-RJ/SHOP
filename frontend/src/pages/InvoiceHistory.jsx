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
            setInvoices(data.invoices || []);
            setFilteredInvoices(data.invoices || []);
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
            <div className="p-4 md:p-8 min-h-screen bg-gray-50/50 dark:bg-[#050505] transition-colors duration-500">
                {/* Header Section */}
                <div className="mb-10 relative">
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none"></div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                        <div>
                            <div className="flex items-center space-x-3 mb-2">
                                <div className="p-2 bg-indigo-500/10 rounded-lg">
                                    <FileText className="w-5 h-5 text-indigo-500" />
                                </div>
                                <span className="text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-[0.3em]">Transaction Vault</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
                                Invoice <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500">History</span>
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium max-w-md">
                                Secure ledger of all business transactions with real-time status tracking.
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/invoice/new')}
                            className="flex items-center space-x-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-[0_20px_40px_rgba(79,70,229,0.2)] hover:shadow-[0_25px_50px_rgba(79,70,229,0.3)] transition-all duration-300 transform hover:-translate-y-1 group"
                        >
                            <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                            <span className="font-black tracking-tight text-lg">Generate Invoice</span>
                        </button>
                    </div>
                </div>

                {/* Advanced Search & Filter Array */}
                <div className="mb-8 relative z-10">
                    <div className="bg-white/80 dark:bg-white/2 backdrop-blur-2xl p-2 rounded-[28px] border border-white dark:border-white/5 shadow-2xl shadow-indigo-500/5">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                            {/* Neural Search */}
                            <div className="lg:col-span-8 relative group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by invoice #, customer name, phone, or IMEI..."
                                    className="w-full pl-14 pr-6 py-4.5 bg-gray-50/50 dark:bg-white/5 border border-transparent focus:border-indigo-500/30 rounded-[22px] text-gray-900 dark:text-white placeholder-gray-400 transition-all outline-none"
                                />
                            </div>

                            {/* Status Intel */}
                            <div className="lg:col-span-4 relative group">
                                <Filter className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-violet-500 transition-colors" />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full pl-14 pr-6 py-4.5 bg-gray-50/50 dark:bg-white/5 border border-transparent focus:border-violet-500/30 rounded-[22px] text-gray-900 dark:text-white transition-all outline-none appearance-none cursor-pointer font-bold"
                                >
                                    <option className="dark:bg-gray-900">All Transactions</option>
                                    <option className="dark:bg-gray-900">Paid</option>
                                    <option className="dark:bg-gray-900">Partial</option>
                                    <option className="dark:bg-gray-900">Due</option>
                                    <option className="dark:bg-gray-900">Void</option>
                                </select>
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* High-Performance Ledger */}
                <div className="relative z-10">
                    {loading ? (
                        <div className="bg-white/50 dark:bg-black/20 backdrop-blur-xl rounded-[32px] border border-white dark:border-white/5 p-20 text-center">
                            <div className="relative inline-block">
                                <div className="w-16 h-16 border-t-2 border-indigo-500 rounded-full animate-spin mx-auto"></div>
                                <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full"></div>
                            </div>
                            <p className="mt-4 text-indigo-600 dark:text-indigo-400 font-bold tracking-widest uppercase text-xs animate-pulse font-mono">Accessing Ledger...</p>
                        </div>
                    ) : filteredInvoices.length === 0 ? (
                        <div className="bg-white/50 dark:bg-black/20 backdrop-blur-xl rounded-[32px] border border-white dark:border-white/5 p-20 text-center group">
                            <div className="relative inline-block mb-6">
                                <div className="absolute inset-0 bg-indigo-500/10 blur-3xl rounded-full group-hover:bg-indigo-500/20 transition-all duration-700"></div>
                                <FileText className="w-20 h-20 text-indigo-500/20 group-hover:text-indigo-500/40 transition-all duration-500 relative z-10 mx-auto" strokeWidth={1} />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Archive Cleared</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">No records matching your search parameters were found.</p>
                            <button onClick={() => navigate('/invoice/new')} className="mt-8 px-8 py-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-xl hover:bg-indigo-500 hover:text-white transition-all duration-300 font-bold uppercase tracking-widest text-xs">
                                Create New Invoice
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white/50 dark:bg-black/20 backdrop-blur-xl rounded-[32px] border border-white dark:border-white/5 overflow-hidden shadow-2xl shadow-indigo-500/5">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-100 dark:border-white/5">
                                            <th className="px-8 py-6 text-left text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">Reference</th>
                                            <th className="px-8 py-6 text-left text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">Stakeholder</th>
                                            <th className="px-8 py-6 text-left text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">Timeline</th>
                                            <th className="px-8 py-6 text-right text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">Gross Capital</th>
                                            <th className="px-8 py-6 text-center text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">Verification Status</th>
                                            <th className="px-8 py-6 text-right text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">System Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                        {filteredInvoices.map((invoice) => (
                                            <tr key={invoice._id} className="group hover:bg-indigo-500/[0.02] transition-colors duration-300">
                                                <td className="px-8 py-5">
                                                    <div>
                                                        <div className="text-base font-black text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors font-mono">
                                                            {invoice.invoiceNo}
                                                        </div>
                                                        <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter mt-0.5">
                                                            {invoice.invoiceType} ID
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-xs border border-indigo-500/10">
                                                            {(invoice.customer?.name || invoice.customerName || 'W').charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-gray-900 dark:text-white">
                                                                {invoice.customer?.name || invoice.customerName || 'Walk-in Partner'}
                                                            </div>
                                                            {invoice.customer?.phone && (
                                                                <div className="text-[10px] font-medium text-gray-400 dark:text-gray-500 tracking-tight">
                                                                    +91 {invoice.customer.phone}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="text-sm font-bold text-gray-600 dark:text-gray-300">
                                                        {formatDate(invoice.invoiceDate || invoice.createdAt)}
                                                    </div>
                                                    <div className="text-[10px] font-medium text-gray-400/60 dark:text-gray-500/40 uppercase tracking-tighter">logged date</div>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="text-base font-black text-gray-900 dark:text-white rupee font-mono tracking-tighter">
                                                        {formatINR(invoice.grandTotal)}
                                                    </div>
                                                    <div className="text-[10px] font-bold text-indigo-600/60 dark:text-indigo-400/40 uppercase tracking-tighter">
                                                        {formatINR(invoice.paidAmount)} settled
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex justify-center">
                                                        <span className={`px-4 py-1 rounded-[10px] text-[10px] font-black uppercase tracking-widest border ${invoice.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                                            invoice.status === 'Partial' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                                                invoice.status === 'Due' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                                                                    'bg-gray-500/10 text-gray-400 border-gray-500/20 line-through'
                                                            }`}>
                                                            {invoice.status}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <button
                                                            onClick={() => navigate(`/invoice/${invoice._id}`)}
                                                            className="p-3 bg-gray-50/50 dark:bg-white/5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-500/5 rounded-xl transition-all duration-300"
                                                            title="Inspect"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            className="p-3 bg-gray-50/50 dark:bg-white/5 text-gray-400 hover:text-emerald-500 hover:bg-emerald-500/5 rounded-xl transition-all duration-300"
                                                            title="Reprint"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleVoidClick(invoice)}
                                                            className="p-3 bg-gray-50/50 dark:bg-white/5 text-gray-400 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all duration-300"
                                                            title="Liquidate"
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

                {/* Intelligent Analytics Dashboard */}
                {!loading && filteredInvoices.length > 0 && (
                    <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                        <div className="bg-white/60 dark:bg-white/2 backdrop-blur-xl rounded-[28px] p-6 border border-white dark:border-white/5 shadow-xl shadow-black/5 group">
                            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-3">Volume Trace</p>
                            <div className="flex items-end justify-between">
                                <p className="text-3xl font-black text-gray-900 dark:text-white font-mono">{filteredInvoices.length}</p>
                                <div className="p-2 bg-indigo-500/10 rounded-lg group-hover:bg-indigo-500/20 transition-colors">
                                    <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/60 dark:bg-white/2 backdrop-blur-xl rounded-[28px] p-6 border border-white dark:border-white/5 shadow-xl shadow-black/5 group">
                            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-3">Gross Liquidity</p>
                            <div className="flex items-end justify-between">
                                <p className="text-2xl font-black text-gray-900 dark:text-white rupee font-mono tracking-tighter">
                                    {formatINR(filteredInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0))}
                                </p>
                                <div className="p-2 bg-violet-500/10 rounded-lg group-hover:bg-violet-500/20 transition-colors">
                                    <Plus className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/60 dark:bg-white/2 backdrop-blur-xl rounded-[28px] p-6 border border-white dark:border-white/5 shadow-xl shadow-black/5 group">
                            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-3">Settled Flow</p>
                            <div className="flex items-end justify-between">
                                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 rupee font-mono tracking-tighter">
                                    {formatINR(filteredInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0))}
                                </p>
                                <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                                    <div className="w-4 h-4 bg-emerald-500 rounded-full animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/60 dark:bg-white/2 backdrop-blur-xl rounded-[28px] p-6 border border-white dark:border-white/5 shadow-xl shadow-black/5 group">
                            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-3">Deficit Ratio</p>
                            <div className="flex items-end justify-between">
                                <p className="text-2xl font-black text-red-600 dark:text-red-400 rupee font-mono tracking-tighter">
                                    {formatINR(filteredInvoices.reduce((sum, inv) => sum + (inv.grandTotal - inv.paidAmount), 0))}
                                </p>
                                <div className="p-2 bg-red-500/10 rounded-lg group-hover:bg-red-500/20 transition-colors">
                                    <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                                </div>
                            </div>
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
