import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import api from '../utils/api';
import { formatINR } from '../utils/currency';
import { formatDate } from '../utils/date';
import { ArrowLeft, RefreshCw, Printer, Plus, X, Edit2, Paperclip, Trash2, Share2, Mail, MessageCircle, Download } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';
import toast from 'react-hot-toast';
import { sharePdf } from '../utils/pdfShare';

const SupplierLedger = ({ isPublic = false }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [supplier, setSupplier] = useState(null);
    const [ledger, setLedger] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [payment, setPayment] = useState({
        amount: '',
        method: 'Cash',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        billFile: null
    });
    const [purchase, setPurchase] = useState({
        amount: '',
        billNo: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        billFile: null
    });
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [entryToDelete, setEntryToDelete] = useState(null);

    useEffect(() => {
        loadData();
    }, [id, isPublic]);

    const loadData = async () => {
        try {
            setLoading(true);
            if (isPublic) {
                const res = await api.get(`/public/suppliers/${id}/ledger`);
                setSupplier(res.data.supplier);
                setLedger(res.data.ledger);
            } else {
                const [supplierRes, ledgerRes] = await Promise.all([
                    api.get(`/suppliers/${id}`),
                    api.get(`/supplier-ledger/${id}`)
                ]);
                setSupplier(supplierRes.data);
                setLedger(ledgerRes.data);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error loading supplier ledger:', error);
            if (!isPublic) toast.error('Failed to load supplier ledger');
            setLoading(false);
        }
    };

    const handleRecalculate = async () => {
        try {
            await api.post(`/supplier-ledger/recalculate/${id}`);
            toast.success('Ledger recalculated');
            loadData();
        } catch (error) {
            toast.error('Recalculation failed');
        }
    };

    const handleRecordPayment = async () => {
        if (!payment.amount || payment.amount <= 0) {
            return toast.error('Please enter a valid amount');
        }

        try {
            const formData = new FormData();
            formData.append('supplierId', id);
            formData.append('amount', parseFloat(payment.amount));
            formData.append('method', payment.method);
            formData.append('date', payment.date);
            formData.append('notes', payment.notes || 'Payment to supplier');
            if (payment.billFile) {
                formData.append('billFile', payment.billFile);
            }

            await api.post('/payments/supplier', formData);

            toast.success('Payment recorded successfully');
            setShowPaymentModal(false);
            setPayment({ amount: '', method: 'Cash', date: new Date().toISOString().split('T')[0], notes: '', billFile: null });
            loadData();
        } catch (error) {
            console.error('Payment error:', error);
            toast.error(error.response?.data?.message || 'Failed to record payment');
        }
    };

    const handleRecordPurchase = async () => {
        if (!purchase.amount || purchase.amount <= 0) {
            return toast.error('Please enter a valid amount');
        }

        try {
            const formData = new FormData();
            formData.append('supplierId', id);
            formData.append('amount', parseFloat(purchase.amount));
            formData.append('billNo', purchase.billNo || '');
            formData.append('date', purchase.date);
            formData.append('notes', purchase.notes || 'Purchase recorded');
            if (purchase.billFile) {
                formData.append('billFile', purchase.billFile);
            }

            await api.post('/supplier-ledger/record-purchase', formData);

            toast.success('Purchase recorded successfully');
            setShowPurchaseModal(false);
            setPurchase({ amount: '', billNo: '', date: new Date().toISOString().split('T')[0], notes: '', billFile: null });
            loadData();
        } catch (error) {
            console.error('Purchase error:', error);
            toast.error(error.response?.data?.message || 'Failed to record purchase');
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

            await api.put(`/supplier-ledger/${editingEntry._id}`, formData);
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
            await api.delete(`/supplier-ledger/${entryToDelete._id}`);
            toast.success('Entry deleted successfully');
            setShowDeleteModal(false);
            setEntryToDelete(null);
            loadData();
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete entry');
        }
    };

    const handleShare = async () => {
        const fileName = `Supplier_Ledger_${supplier?.name || 'Report'}.pdf`;
        const title = `Ledger Statement - ${supplier?.name}`;
        const text = `Please find attached the ledger statement for ${supplier?.name}.`;

        await sharePdf('ledger-content', fileName, title, text);
    };

    const handleWhatsAppShare = () => {
        const shareUrl = `${window.location.origin}/share/supplier/${id}/ledger`;
        const text = `Here is the ledger statement for ${supplier?.name || 'Supplier'}: ${shareUrl}`;

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
                                onClick={() => navigate('/suppliers')}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                            </button>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {loading ? 'Loading...' : `${supplier?.name} - Purchase Ledger`}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                {supplier?.phone} | {supplier?.address}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        {isPublic ? (
                            <>
                                <button
                                    onClick={handleShare}
                                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                    <span>Download PDF</span>
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
                                    title="Download as PDF"
                                >
                                    <Download className="w-4 h-4" />
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
                                    onClick={() => setShowPurchaseModal(true)}
                                    className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Record Purchase (Quick)</span>
                                </button>
                                <button
                                    onClick={() => navigate(`/purchase-entry?supplierId=${id}`)}
                                    className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Stock Inward</span>
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
                        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            <Printer className="w-4 h-4" />
                            <span>Print</span>
                        </button>
                    </div>
                </div>

            </div>

            {/* Gold Standard Ledger Content */}
            <div id="ledger-content" className="bg-white/80 dark:bg-black/40 backdrop-blur-xl p-4 rounded-[32px] border-[2.5px] border-amber-500/30 shadow-2xl transition-all duration-300">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white/50 dark:bg-black/20 p-6 rounded-[24px] border border-red-500/20 box-shadow-sm hover:border-red-500/40 transition-all">
                        <p className="text-[10px] uppercase tracking-widest font-black text-gray-500 dark:text-gray-400 mb-2">Total Credit (Purchases)</p>
                        <p className="text-3xl font-black text-red-600 dark:text-red-400 rupee">
                            {formatINR(ledger.reduce((sum, entry) => sum + (entry.credit || 0), 0))}
                        </p>
                    </div>
                    <div className="bg-white/50 dark:bg-black/20 p-6 rounded-[24px] border border-green-500/20 box-shadow-sm hover:border-green-500/40 transition-all">
                        <p className="text-[10px] uppercase tracking-widest font-black text-gray-500 dark:text-gray-400 mb-2">Total Debit (Paid)</p>
                        <p className="text-3xl font-black text-green-600 dark:text-green-400 rupee">
                            {formatINR(ledger.reduce((sum, entry) => sum + (entry.debit || 0), 0))}
                        </p>
                    </div>
                    <div className="bg-amber-500/10 dark:bg-amber-500/5 p-6 rounded-[24px] border border-amber-500/30 box-shadow-lg shadow-amber-500/10">
                        <p className="text-[10px] uppercase tracking-widest font-black text-amber-800 dark:text-amber-400 mb-2">Net Amount Owed</p>
                        <p className="text-4xl font-black text-amber-700 dark:text-amber-500 rupee tracking-tight">
                            {formatINR(supplier?.balance || 0)}
                        </p>
                    </div>
                </div>

                {/* Ledger Table */}
                <div className="bg-white/50 dark:bg-black/20 rounded-[24px] overflow-hidden border border-gray-100 dark:border-white/5 transition-colors">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b-[2.5px] border-black dark:border-white/90">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Particulars</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ref No</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bill</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-green-600 dark:text-green-400">Debit (Dr)</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-red-600 dark:text-red-400">Credit (Cr)</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Balance</th>
                                    {!isPublic && <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-8">Loading ledger...</td>
                                    </tr>
                                ) : ledger.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-8 text-gray-500">No transactions found</td>
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
                                            <td className="px-6 py-4 text-sm text-center">
                                                {entry.billAttachment ? (
                                                    <a
                                                        href={`${api.defaults.baseURL}${entry.billAttachment}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center justify-center p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                                        title="View Attachment"
                                                    >
                                                        <Paperclip className="w-4 h-4" />
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-300 dark:text-gray-600">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right font-medium text-green-600 dark:text-green-400">
                                                {entry.debit > 0 ? formatINR(entry.debit) : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right font-medium text-red-600 dark:text-red-400">
                                                {entry.credit > 0 ? formatINR(entry.credit) : '-'}
                                            </td>
                                            <td className="px-6 py-5 text-sm text-right font-black text-gray-900 dark:text-white rupee bg-gray-50/50 dark:bg-white/5 rounded-lg m-1">
                                                {formatINR(entry.balance)}
                                            </td>
                                            {!isPublic && (
                                                <td className="px-6 py-4 text-sm text-center">
                                                    <button
                                                        onClick={() => handleEditClick(entry)}
                                                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors text-gray-500 hover:text-blue-600"
                                                        title="Edit Entry"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(entry)}
                                                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors text-red-500 hover:text-red-700 ml-1"
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
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-b-[2.5px] border-black dark:border-white/90 pb-2">Record Payment to Supplier</h3>

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
                                        placeholder="Enter amount paid"
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
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="Cheque">Cheque</option>
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
                                        placeholder="e.g., Payment for Bill #123"
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Bill Attachment (Optional)
                                    </label>
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <Paperclip className="w-8 h-8 text-gray-400 mb-2" />
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {payment.billFile ? payment.billFile.name : 'Click to upload bill image/PDF'}
                                            </p>
                                        </div>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*,.pdf"
                                            onChange={(e) => setPayment({ ...payment, billFile: e.target.files[0] })}
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t-[2.5px] border-black dark:border-white/90">
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

            {/* Purchase Recording Modal */}
            {
                showPurchaseModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-2xl transition-colors">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-b-[2.5px] border-black dark:border-white/90 pb-2">Record Purchase</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Date *
                                    </label>
                                    <input
                                        type="date"
                                        value={purchase.date}
                                        onChange={(e) => setPurchase({ ...purchase, date: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Amount *
                                    </label>
                                    <input
                                        type="number"
                                        value={purchase.amount}
                                        onChange={(e) => setPurchase({ ...purchase, amount: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                                        placeholder="Enter purchase amount"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Bill Number (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={purchase.billNo}
                                        onChange={(e) => setPurchase({ ...purchase, billNo: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                                        placeholder="e.g., BILL-123"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Notes (Optional)
                                    </label>
                                    <textarea
                                        value={purchase.notes}
                                        onChange={(e) => setPurchase({ ...purchase, notes: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                                        rows="3"
                                        placeholder="e.g., 10 boxes of LED bulbs"
                                    ></textarea>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Bill Attachment (Optional)
                                        </label>
                                        {!purchase.billFile ? (
                                            <>
                                                <input
                                                    type="file"
                                                    accept="image/*,.pdf"
                                                    onChange={(e) => setPurchase({ ...purchase, billFile: e.target.files[0] })}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-700 transition-colors"
                                                />
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Upload bill image or PDF (max 5MB)</p>
                                            </>
                                        ) : (
                                            <div className="flex items-center justify-between p-2 border border-orange-200 bg-orange-50 rounded-lg">
                                                <div className="flex items-center space-x-2 overflow-hidden">
                                                    <span className="text-sm font-medium text-orange-800">File selected:</span>
                                                    <span className="text-sm text-gray-700 truncate">{purchase.billFile.name}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setPurchase({ ...purchase, billFile: null })}
                                                    className="text-red-500 hover:bg-red-50 p-1 rounded-full transition-colors"
                                                    title="Remove File"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    onClick={() => setShowPurchaseModal(false)}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRecordPurchase}
                                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
                                >
                                    Record Purchase
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
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Edit Ledger Entry</h3>

                            <form onSubmit={handleUpdateEntry} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                                    <input
                                        type="date"
                                        value={editingEntry.date ? new Date(editingEntry.date).toLocaleDateString('en-CA') : ''}
                                        onChange={(e) => setEditingEntry({ ...editingEntry, date: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                    <input
                                        type="text"
                                        value={editingEntry.description || ''}
                                        onChange={(e) => setEditingEntry({ ...editingEntry, description: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reference No</label>
                                    <input
                                        type="text"
                                        value={editingEntry.refNo || ''}
                                        onChange={(e) => setEditingEntry({ ...editingEntry, refNo: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-green-600">Debit</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={editingEntry.debit || 0}
                                            onChange={(e) => setEditingEntry({ ...editingEntry, debit: parseFloat(e.target.value) || 0 })}
                                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-red-600">Credit</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={editingEntry.credit || 0}
                                            onChange={(e) => setEditingEntry({ ...editingEntry, credit: parseFloat(e.target.value) || 0 })}
                                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                    </div>
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


                                <div className="flex justify-end space-x-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowEditModal(false);
                                            setEditingEntry(null);
                                        }}
                                        className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                                    >
                                        Update Entry
                                    </button>
                                </div>
                            </form>
                        </div >
                    </div >
                )
            }


            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setEntryToDelete(null);
                }}
                onConfirm={confirmDelete}
                title="Delete Ledger Entry"
                message="Are you sure you want to delete this transaction? This action cannot be undone and will affect the supplier balance."
                confirmText="Delete Entry"
                isDangerous={true}
            />
        </Layout >
    );
};

export default SupplierLedger;
