import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import api from '../utils/api';
import { formatINR } from '../utils/currency';
import { AlertTriangle, Calendar, Package } from 'lucide-react';
import toast from 'react-hot-toast';

const ExpiryReport = () => {
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(30);

    const fetchExpiringBatches = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/products/expiry-alert?days=${days}`);
            setBatches(res.data);
        } catch (error) {
            console.error('Failed to fetch expiry report:', error);
            toast.error('Failed to load report');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpiringBatches();
    }, [days]);

    const getExpiryStatus = (date) => {
        const today = new Date();
        const expiry = new Date(date);
        const diffTime = expiry - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { label: 'EXPIRED', color: 'text-red-600 bg-red-100', days: diffDays };
        if (diffDays <= 30) return { label: 'CRITICAL', color: 'text-red-500 bg-red-50', days: diffDays };
        return { label: 'WARNING', color: 'text-orange-500 bg-orange-50', days: diffDays };
    };

    return (
        <Layout>
            <div className="p-8 bg-gray-50 min-h-screen">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Expiry <span className="text-rose-600">Report</span></h1>
                        <p className="text-gray-500 mt-1 font-medium">Track products nearing expiration</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <select
                            value={days}
                            onChange={(e) => setDays(Number(e.target.value))}
                            className="px-4 py-2 border border-gray-200 rounded-xl font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                        >
                            <option value={30}>Next 30 Days</option>
                            <option value={60}>Next 60 Days</option>
                            <option value={90}>Next 90 Days</option>
                            <option value={180}>Next 6 Months</option>
                        </select>
                        <button
                            onClick={fetchExpiringBatches}
                            className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors"
                        >
                            <Calendar className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : batches.length === 0 ? (
                    <div className="bg-white rounded-[24px] p-12 text-center border border-gray-100 shadow-xl">
                        <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900">No Expiring Items Found</h3>
                        <p className="text-gray-500 mt-2">Good news! No items are expiring in the selected range.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-[24px] overflow-hidden border border-gray-100 shadow-xl">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Status</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Product Name</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Batch No</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400 text-center">Qty</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400 text-right">MRP</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400 text-right">Expiry Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {batches.map((batch) => {
                                    const status = getExpiryStatus(batch.expiryDate);
                                    return (
                                        <tr key={batch._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider ${status.color}`}>
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">{batch.product?.name || 'Unknown Product'}</div>
                                                <div className="text-xs text-gray-500 font-medium">{batch.product?.sku}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-gray-700">{batch.batchNumber}</td>
                                            <td className="px-6 py-4 text-center font-bold text-gray-900">{batch.quantity}</td>
                                            <td className="px-6 py-4 text-right font-bold text-gray-900">{formatINR(batch.mrp)}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="font-bold text-gray-900">{new Date(batch.expiryDate).toLocaleDateString()}</div>
                                                <div className={`text-xs font-bold mt-0.5 ${status.days < 0 ? 'text-red-500' : 'text-orange-500'}`}>
                                                    {status.days < 0 ? `${Math.abs(status.days)} days ago` : `in ${status.days} days`}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default ExpiryReport;
