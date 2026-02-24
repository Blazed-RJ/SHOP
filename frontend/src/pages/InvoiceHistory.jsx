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

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
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

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFilteredInvoices(filtered);
    }, [searchQuery, statusFilter, invoices]);

    const handleVoidClick = (invoice) => {
        setSelectedInvoice(invoice);
        setShowVoidModal(true);
    };

    const confirmDelete = async () => {
        try {
            // Hard Delete API Call
            await api.delete(`/invoices/${selectedInvoice._id}`);
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
                    <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl p-6 box-outline shadow-2xl border-b-[2.5px] border-black dark:border-white/90 transition-all duration-300">
                        <div className="flex flex-col md:flex-row gap-4 items-center">
                            {/* Neural Search */}
                            <div className="relative group flex-grow">
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
                            <div className="relative group w-full md:w-auto">
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
                            </div>
                        </div>
                    </div>
                </div>

                {/* High-Performance Ledger */}
                <div className="relative z-10 transition-all duration-500">
                    {loading ? (
                        <div className="bg-white/50 dark:bg-black/20 backdrop-blur-xl rounded-[32px] box-outline p-20 text-center transition-all duration-300">
                            <div className="relative inline-block">
                                <div className="w-16 h-16 border-t-2 border-indigo-500 rounded-full animate-spin mx-auto"></div>
                                <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full"></div>
                            </div>
                            <p className="mt-4 text-indigo-600 dark:text-indigo-400 font-bold tracking-widest uppercase text-xs animate-pulse font-mono">Accessing Ledger...</p>
                        </div>
                    ) : filteredInvoices.length === 0 ? (
                        <div className="bg-white/50 dark:bg-black/20 backdrop-blur-xl rounded-[32px] box-outline p-20 text-center group transition-all duration-300">
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
                        <div className="bg-white/50 dark:bg-black/20 backdrop-blur-xl rounded-[32px] box-outline overflow-hidden shadow-2xl transition-all duration-300">
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b-[2.5px] border-black dark:border-white/90">
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
                                                        <span className={`px-4 py-1 rounded-[10px] text-[10px] font-black uppercase tracking-widest border transition-all duration-300 ${invoice.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20' :
                                                            invoice.status === 'Partial' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20' :
                                                                invoice.status === 'Due' ? 'bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20' :
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

                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-4 p-4">
                                {filteredInvoices.map((invoice) => (
                                    <div key={invoice._id} className="bg-white dark:bg-white/5 rounded-2xl p-5 border border-gray-100 dark:border-white/10 shadow-sm relative overflow-hidden group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="text-xl font-black text-gray-900 dark:text-white font-mono tracking-tight">
                                                    {invoice.invoiceNo}
                                                </div>
                                                <div className="test-xs font-bold text-indigo-500 uppercase tracking-wider mt-1">
                                                    {formatDate(invoice.invoiceDate || invoice.createdAt)}
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${invoice.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                                invoice.status === 'Partial' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                                    invoice.status === 'Due' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                                                        'bg-gray-500/10 text-gray-400 border-gray-500/20 line-through'
                                                }`}>
                                                {invoice.status}
                                            </span>
                                        </div>

                                        <div className="flex items-center space-x-3 mb-4 p-3 bg-gray-50 dark:bg-black/20 rounded-xl">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                                                {(invoice.customer?.name || invoice.customerName || 'W').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-gray-900 dark:text-white">
                                                    {invoice.customer?.name || invoice.customerName || 'Walk-in Partner'}
                                                </div>
                                                {invoice.customer?.phone && (
                                                    <div className="text-[10px] text-gray-500 dark:text-gray-400">
                                                        +91 {invoice.customer.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-end mb-4 border-t border-gray-100 dark:border-white/5 pt-4">
                                            <div>
                                                <div className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400 font-bold">Total Amount</div>
                                                <div className="text-2xl font-black text-gray-900 dark:text-white rupee font-mono">
                                                    {formatINR(invoice.grandTotal)}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400 font-bold">Paid</div>
                                                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 rupee font-mono">
                                                    {formatINR(invoice.paidAmount)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2">
                                            <button
                                                onClick={() => navigate(`/invoice/${invoice._id}`)}
                                                className="flex items-center justify-center py-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
                                            >
                                                <Eye className="w-4 h-4 mr-2" /> View
                                            </button>
                                            <button
                                                className="flex items-center justify-center py-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                                            >
                                                <Download className="w-4 h-4 mr-2" /> PDF
                                            </button>
                                            <button
                                                onClick={() => handleVoidClick(invoice)}
                                                className="flex items-center justify-center py-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" /> Void
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Intelligent Analytics Dashboard */}
                {!loading && filteredInvoices.length > 0 && (
                    <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                        <div className="bg-gradient-to-br from-indigo-100 via-indigo-50 to-white dark:bg-gradient-to-br dark:from-indigo-950 dark:via-black dark:to-black backdrop-blur-xl rounded-[28px] p-6 box-outline shadow-lg shadow-indigo-200/50 dark:shadow-[0_0_15px_rgba(99,102,241,0.15)] group transition-all duration-300">
                            <p className="text-[10px] font-black text-indigo-800/60 dark:text-indigo-300 uppercase tracking-[0.2em] mb-3">Volume Trace</p>
                            <div className="flex items-end justify-between">
                                <p className="text-3xl font-black text-indigo-600 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-indigo-100 dark:via-indigo-300 dark:to-indigo-500 font-mono">{filteredInvoices.length}</p>
                                <div className="p-2 bg-indigo-500/10 rounded-lg group-hover:bg-indigo-500/20 transition-colors">
                                    <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-100 via-emerald-50 to-white dark:bg-gradient-to-br dark:from-emerald-950 dark:via-black dark:to-black backdrop-blur-xl rounded-[28px] p-6 box-outline shadow-lg shadow-emerald-200/50 dark:shadow-[0_0_15px_rgba(16,185,129,0.15)] group transition-all duration-300">
                            <p className="text-[10px] font-black text-emerald-800/60 dark:text-emerald-300 uppercase tracking-[0.2em] mb-3">Gross Liquidity</p>
                            <div className="flex items-end justify-between">
                                <p className="text-2xl font-black text-emerald-600 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-emerald-100 dark:via-emerald-300 dark:to-emerald-500 rupee font-mono tracking-tighter">
                                    {formatINR(filteredInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0))}
                                </p>
                                <div className="p-2 bg-white/80 dark:bg-emerald-500/20 rounded-lg border border-emerald-100 dark:border-emerald-500/30 group-hover:bg-emerald-600 dark:group-hover:bg-emerald-500 transition-colors">
                                    <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-cyan-100 via-cyan-50 to-white dark:bg-gradient-to-br dark:from-cyan-950 dark:via-black dark:to-black backdrop-blur-xl rounded-[28px] p-6 box-outline shadow-lg shadow-cyan-200/50 dark:shadow-[0_0_15px_rgba(6,182,212,0.15)] group transition-all duration-300">
                            <p className="text-[10px] font-black text-cyan-800/60 dark:text-cyan-300 uppercase tracking-[0.2em] mb-3">Settled Flow</p>
                            <div className="flex items-end justify-between">
                                <p className="text-2xl font-black text-cyan-600 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-cyan-100 dark:via-cyan-300 dark:to-cyan-500 rupee font-mono tracking-tighter">
                                    {formatINR(filteredInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0))}
                                </p>
                                <div className="p-2 bg-white/80 dark:bg-cyan-500/20 rounded-lg border border-cyan-100 dark:border-cyan-500/30 group-hover:bg-cyan-600 dark:group-hover:bg-cyan-500 transition-colors">
                                    <div className="w-4 h-4 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-red-100 via-red-50 to-white dark:bg-gradient-to-br dark:from-red-950 dark:via-black dark:to-black backdrop-blur-xl rounded-[28px] p-6 box-outline shadow-lg shadow-red-200/50 dark:shadow-[0_0_15px_rgba(239,68,68,0.15)] group transition-all duration-300">
                            <p className="text-[10px] font-black text-red-800/60 dark:text-red-300 uppercase tracking-[0.2em] mb-3">Deficit Ratio</p>
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
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-[#0A0A0A] rounded-[32px] max-w-md w-full p-8 box-outline shadow-2xl animate-in zoom-in duration-300 overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-rose-600"></div>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-red-500/10 rounded-2xl">
                                <Trash2 className="w-6 h-6 text-red-500" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Liquidate Invoice</h3>
                        </div>

                        <div className="p-6 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-500/20 mb-8">
                            <p className="text-sm text-red-800 dark:text-red-300 font-bold mb-4 uppercase tracking-widest">Permanent Removal Protocol</p>
                            <ul className="space-y-3">
                                {[
                                    'Restores items to primary inventory',
                                    'Reverts customer balance liability',
                                    'Purges transaction from official ledger'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-red-700 dark:text-red-400/80">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowVoidModal(false)}
                                className="flex-1 px-6 py-4 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
                            >
                                Abort
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 px-6 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-red-600/20 hover:bg-red-500 transition-all transform hover:-translate-y-1"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default InvoiceHistory;
