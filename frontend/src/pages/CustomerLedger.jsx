import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import api from '../utils/api';
import { formatINR } from '../utils/currency';
import { formatDate } from '../utils/date';
import { ArrowLeft, RefreshCw, Printer, Plus, Edit2, Trash2, Paperclip, X, Share2, Mail, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { sharePdf } from '../utils/pdfShare';
import ConfirmationModal from '../components/ConfirmationModal';

import { useSettings } from '../context/SettingsContext';

const CustomerLedger = ({ isPublic = false }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { settings } = useSettings();
    const [customer, setCustomer] = useState(null);
    const [ledger, setLedger] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [entryToDelete, setEntryToDelete] = useState(null);
    const [payment, setPayment] = useState({
        amount: '',
        method: 'Cash',
        date: new Date().toISOString().split('T')[0],
        notes: ''
    });

    const [showEditModal, setShowEditModal] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            if (isPublic) {
                const res = await api.get(`/public/customers/${id}/ledger`);
                setCustomer(res.data.customer);
                setLedger(res.data.ledger);
            } else {
                const [customerRes, ledgerRes] = await Promise.all([
                    api.get(`/customers/${id}`),
                    api.get(`/ledger/${id}`)
                ]);
                setCustomer(customerRes.data);
                setLedger(ledgerRes.data.ledger);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error loading ledger:', error);
            if (!isPublic) toast.error('Failed to load ledger');
            setLoading(false);
        }
    }, [id, isPublic]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleRecalculate = async () => {
        try {
            await api.post(`/ledger/recalculate/${id}`);
            toast.success('Ledger recalculated');
            loadData();
        } catch {
            toast.error('Recalculation failed');
        }
    };

    const handleRecordPayment = async () => {
        if (!payment.amount || payment.amount <= 0) {
            return toast.error('Please enter a valid amount');
        }

        try {
            // Create payment via backend
            await api.post('/payments', {
                customerId: id,
                amount: parseFloat(payment.amount),
                method: payment.method,
                date: payment.date,
                notes: payment.notes || 'Direct payment recorded'
            });

            toast.success('Payment recorded successfully');
            setShowPaymentModal(false);
            setPayment({ amount: '', method: 'Cash', date: new Date().toISOString().split('T')[0], notes: '' });
            loadData();
        } catch (error) {
            console.error('Payment error:', error);
            toast.error(error.response?.data?.message || 'Failed to record payment');
        }
    };

    const handleEditClick = (entry) => {
        setEditingEntry({ ...entry, deleteAttachment: false });
        setShowEditModal(true);
    };

    const handleUpdateEntry = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('date', editingEntry.date);
            formData.append('description', editingEntry.description);
            formData.append('refNo', editingEntry.refNo || '');
            formData.append('debit', editingEntry.debit || 0);
            formData.append('credit', editingEntry.credit || 0);

            if (editingEntry.billFile) {
                formData.append('billFile', editingEntry.billFile);
            }
            if (editingEntry.deleteAttachment) {
                formData.append('deleteAttachment', 'true');
            }

            await api.put(`/ledger/${editingEntry._id}`, formData);
            toast.success('Entry updated successfully');
            setShowEditModal(false);
            setEditingEntry(null);
            loadData();
        } catch (error) {
            console.error('Update error:', error);
            toast.error('Failed to update entry');
        }
    };

    const handleDeleteClick = (entry) => {
        setEntryToDelete(entry);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!entryToDelete) return;

        try {
            await api.delete(`/ledger/${entryToDelete._id}`);
            toast.success('Entry deleted successfully');
            loadData();
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete entry');
        } finally {
            setShowDeleteModal(false);
            setEntryToDelete(null);
        }
    };

    const handleShare = async () => {
        const fileName = `Customer_Ledger_${customer?.name || 'Report'}.pdf`;
        const title = `Ledger Statement - ${customer?.name}`;
        const text = `Please find attached the ledger statement for ${customer?.name}.`;

        await sharePdf('ledger-content', fileName, title, text);
    };

    const handleWhatsAppShare = () => {
        const shareUrl = `${window.location.origin}/share/customer/${id}/ledger`;
        const text = `Here is the ledger statement for ${customer?.name || 'Customer'}: ${shareUrl}`;

        // Use whatsappNumber from settings if available, otherwise open WhatsApp without recipient
        const whatsappNumber = settings?.whatsappNumber || '';
        const waLink = whatsappNumber
            ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`
            : `https://wa.me/?text=${encodeURIComponent(text)}`;

        window.open(waLink, '_blank');
    };

    return (
        <Layout>
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                        {!isPublic && (
                            <button
                                onClick={() => navigate('/customers')}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                            </button>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {loading ? 'Loading...' : `${customer?.name} - Ledger`}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                {customer?.phone} | {customer?.address}
                            </p>
                        </div>
                    </div>

                    {isPublic ? (
                        <>
                            <button
                                onClick={handleShare}
                                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <Share2 className="w-4 h-4" />
                                <span>Share PDF</span>
                            </button>
                            <button
                                onClick={handleWhatsAppShare}
                                className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                            >
                                <MessageCircle className="w-4 h-4" />
                                <span>WhatsApp</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={handleShare}
                                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Share2 className="w-4 h-4" />
                                <span>Download PDF</span>
                            </button>
                            <button
                                onClick={handleWhatsAppShare}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-green-200"
                                title="Share on WhatsApp"
                            >
                                <MessageCircle className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setShowPaymentModal(true)}
                                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Record Payment</span>
                            </button>
                            <button
                                onClick={handleRecalculate}
                                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                <span>Recalculate</span>
                            </button>
                        </>
                    )}
                    <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <Printer className="w-4 h-4" />
                        <span>Print</span>
                    </button>
                </div>

            </div>

            {/* Gold Standard Ledger Content */}
            <div id="ledger-content" className="bg-white/80 dark:bg-black/40 backdrop-blur-xl p-4 rounded-[32px] border-[2.5px] border-amber-500/30 shadow-2xl transition-all duration-300">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white/50 dark:bg-black/20 p-6 rounded-[24px] border border-red-500/20 box-shadow-sm hover:border-red-500/40 transition-all">
                        <p className="text-[10px] uppercase tracking-widest font-black text-gray-500 dark:text-gray-400 mb-2">Total Debit (Sales)</p>
                        <p className="text-3xl font-black text-red-600 dark:text-red-400 rupee">
                            {formatINR(ledger.reduce((sum, entry) => sum + (entry.debit || 0), 0))}
                        </p>
                    </div>
                    <div className="bg-white/50 dark:bg-black/20 p-6 rounded-[24px] border border-green-500/20 box-shadow-sm hover:border-green-500/40 transition-all">
                        <p className="text-[10px] uppercase tracking-widest font-black text-gray-500 dark:text-gray-400 mb-2">Total Credit (Received)</p>
                        <p className="text-3xl font-black text-green-600 dark:text-green-400 rupee">
                            {formatINR(ledger.reduce((sum, entry) => sum + (entry.credit || 0), 0))}
                        </p>
                    </div>
                    <div className="bg-amber-500/10 dark:bg-amber-500/5 p-6 rounded-[24px] border border-amber-500/30 box-shadow-lg shadow-amber-500/10">
                        <p className="text-[10px] uppercase tracking-widest font-black text-amber-800 dark:text-amber-400 mb-2">Net Balance Due</p>
                        <p className="text-4xl font-black text-amber-700 dark:text-amber-500 rupee tracking-tight">
                            {formatINR(customer?.balance || 0)}
                        </p>
                    </div>
                </div>

                {/* Ledger Table */}
                <div className="bg-white/50 dark:bg-black/20 rounded-[24px] overflow-hidden border border-gray-100 dark:border-white/5 transition-colors">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 dark:bg-white/5 border-b-[2.5px] border-black dark:border-white/90">
                                    <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Date</th>
                                    <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Particulars</th>
                                    <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Ref No</th>
                                    <th className="px-6 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Bill</th>
                                    <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-red-600/70 dark:text-red-400/70">Debit (Dr)</th>
                                    <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-green-600/70 dark:text-green-400/70">Credit (Cr)</th>
                                    <th className="px-6 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Balance</th>
                                    {!isPublic && <th className="px-6 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan="8" className="text-center py-8">Loading ledger...</td>
                                    </tr>
                                ) : ledger.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="text-center py-8 text-gray-500">No transactions found</td>
                                    </tr>
                                ) : (
                                    ledger.map((entry) => (
                                        <tr key={entry._id} className="hover:bg-amber-500/5 dark:hover:bg-amber-500/10 transition-colors group">
                                            <td className="px-6 py-5 text-xs font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                                {formatDate(entry.date)}
                                            </td>
                                            <td className="px-6 py-5 text-sm text-gray-900 dark:text-gray-100">
                                                <div className="font-black text-xs uppercase tracking-wide">{entry.refType}</div>
                                                <div className="text-gray-500 dark:text-gray-400 text-[10px] font-medium mt-0.5">{entry.description}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono">
                                                {entry.refNo || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-gray-300">-</span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right font-medium text-red-600 dark:text-red-400">
                                                {entry.debit > 0 ? formatINR(entry.debit) : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right font-medium text-green-600 dark:text-green-400">
                                                {entry.credit > 0 ? formatINR(entry.credit) : '-'}
                                            </td>
                                            <td className="px-6 py-5 text-sm text-right font-black text-gray-900 dark:text-white rupee bg-gray-50/50 dark:bg-white/5 rounded-lg m-1">
                                                {formatINR(entry.balance)}
                                            </td>
                                            {!isPublic && (
                                                <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                                                    <button
                                                        onClick={() => handleEditClick(entry)}
                                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                        title="Edit Entry"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(entry)}
                                                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        title="Delete Entry"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div> {/* End of ledger-content */}

            {/* Payment Recording Modal */}
            {
                showPaymentModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-2xl transition-colors">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-b-[2.5px] border-black dark:border-white/90 pb-2">Record Payment</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Date *
                                    </label>
                                    <input
                                        type="date"
                                        value={payment.date}
                                        onChange={(e) => setPayment({ ...payment, date: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Amount *
                                    </label>
                                    <input
                                        type="number"
                                        value={payment.amount}
                                        onChange={(e) => setPayment({ ...payment, amount: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                                        placeholder="Enter amount received"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Payment Method *
                                    </label>
                                    <select
                                        value={payment.method}
                                        onChange={(e) => setPayment({ ...payment, method: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Credit">Credit</option>
                                        <option value="UPI">UPI</option>
                                        <option value="Card">Card</option>
                                        <option value="Cheque">Cheque</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="Online">Online</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Notes (Optional)
                                    </label>
                                    <textarea
                                        value={payment.notes}
                                        onChange={(e) => setPayment({ ...payment, notes: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                                        rows="3"
                                        placeholder="e.g., Payment for Invoice #123"
                                    ></textarea>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRecordPayment}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                                >
                                    Record Payment
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Edit Entry Modal */}
            {
                showEditModal && editingEntry && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-2xl transition-colors">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit Entry</h3>
                                <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleUpdateEntry} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                                    <input
                                        type="date"
                                        value={editingEntry.date ? new Date(editingEntry.date).toLocaleDateString('en-CA') : ''}
                                        onChange={(e) => setEditingEntry({ ...editingEntry, date: e.target.value })}
                                        className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                                    <input
                                        type="text"
                                        value={editingEntry.description}
                                        onChange={(e) => setEditingEntry({ ...editingEntry, description: e.target.value })}
                                        className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ref No</label>
                                    <input
                                        type="text"
                                        value={editingEntry.refNo || ''}
                                        onChange={(e) => setEditingEntry({ ...editingEntry, refNo: e.target.value })}
                                        className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-red-600">Debit</label>
                                        <input
                                            type="number"
                                            value={editingEntry.debit}
                                            onChange={(e) => setEditingEntry({ ...editingEntry, debit: e.target.value })}
                                            className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            step="0.01"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-green-600">Credit</label>
                                        <input
                                            type="number"
                                            value={editingEntry.credit}
                                            onChange={(e) => setEditingEntry({ ...editingEntry, credit: e.target.value })}
                                            className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            step="0.01"
                                        />
                                    </div>
                                    <div className="flex">
                                        <div className="w-full">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bill Attachment</label>
                                            {!editingEntry.billFile && !editingEntry.billAttachment ? (
                                                <input
                                                    type="file"
                                                    accept="image/*,.pdf"
                                                    onChange={(e) => setEditingEntry({ ...editingEntry, billFile: e.target.files[0] })}
                                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                                    <div className="flex items-center space-x-2 overflow-hidden">
                                                        <Paperclip className="w-4 h-4 text-gray-500" />
                                                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                                            {editingEntry.billFile ? editingEntry.billFile.name : 'Existing Attachment'}
                                                        </span>
                                                        {!editingEntry.billFile && editingEntry.billAttachment && !editingEntry.deleteAttachment && (
                                                            <a href={`${api.defaults.baseURL}${editingEntry.billAttachment}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                                                                (View)
                                                            </a>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center">
                                                        {editingEntry.deleteAttachment ? (
                                                            <span className="text-xs text-red-500 font-medium mr-2">Deleted</span>
                                                        ) : null}
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (editingEntry.billFile) {
                                                                    setEditingEntry({ ...editingEntry, billFile: null });
                                                                } else {
                                                                    // Toggle deletion for existing
                                                                    if (editingEntry.deleteAttachment) {
                                                                        setEditingEntry({ ...editingEntry, deleteAttachment: false });
                                                                    } else {
                                                                        setEditingEntry({ ...editingEntry, deleteAttachment: true });
                                                                    }
                                                                }
                                                            }}
                                                            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded-full transition-colors"
                                                            title="Remove/Delete File"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg dark:text-gray-400 dark:hover:bg-gray-700"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Update Entry
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                title="Delete Entry"
                message="Are you sure you want to delete this transaction? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                isDangerous={true}
            />
        </Layout >
    );
};

export default CustomerLedger;
