import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import api from '../utils/api';
import { Plus, Search, FileText, Trash2, Printer, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '../utils/date';

const LetterheadList = () => {
    const navigate = useNavigate();
    const [letterheads, setLetterheads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const loadLetterheads = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/letterheads?search=${searchTerm}`);
            setLetterheads(data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to load letterheads', error);
            toast.error('Failed to load letterheads');
            setLoading(false);
        }
    }, [searchTerm]);

    useEffect(() => {
        loadLetterheads();
    }, [loadLetterheads]);



    const handleDelete = async (id) => {
        if (!window.confirm('Delete this letterhead document? This cannot be undone.')) return;
        try {
            await api.delete(`/letterheads/${id}`);
            toast.success('Deleted successfully');
            loadLetterheads();
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    return (
        <Layout>
            <div className="p-6 md:p-8 min-h-screen bg-gray-50/50 dark:bg-[#050505] transition-colors duration-500">
                {/* Header Section */}
                <div className="mb-10 relative">
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-amber-500/10 blur-[120px] rounded-full pointer-events-none"></div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                        <div>
                            <div className="flex items-center space-x-3 mb-2">
                                <div className="p-2 bg-amber-500/10 rounded-lg">
                                    <FileText className="w-5 h-5 text-amber-500" />
                                </div>
                                <span className="text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-[0.3em]">Official Docs</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-yellow-500">Letterheads</span>
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium max-w-md">
                                Manage your official correspondence and templates
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/letterheads/create')}
                            className="flex items-center space-x-2 px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl shadow-[0_20px_40px_rgba(217,119,6,0.2)] hover:shadow-[0_25px_50px_rgba(217,119,6,0.3)] transition-all duration-300 transform hover:-translate-y-1 group"
                        >
                            <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                            <span className="font-black tracking-tight text-lg">Create New</span>
                        </button>
                    </div>
                </div>

                {/* High-Fidelity Search Hub */}
                <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl p-6 border-[2.5px] border-amber-500/30 shadow-[0_4px_20px_-8px_rgba(245,158,11,0.3)] mb-8 relative z-10 transition-all duration-300 rounded-[24px]">
                    <div className="relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Universal Search Letterheads..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 border border-transparent bg-gray-50/50 dark:bg-white/5 rounded-[22px] text-sm font-bold focus:ring-2 focus:ring-amber-500/20 focus:bg-white dark:focus:bg-black transition-all placeholder-gray-400 text-gray-900 dark:text-white"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border-[2.5px] border-amber-500/30 shadow-2xl mb-8 relative z-10 transition-all duration-300 rounded-[32px] overflow-hidden">
                    {loading ? (
                        <div className="p-20 text-center">
                            <div className="relative inline-block">
                                <div className="w-12 h-12 border-t-2 border-amber-500 rounded-full animate-spin mx-auto"></div>
                            </div>
                            <p className="mt-4 text-amber-600 dark:text-amber-400 font-bold tracking-widest uppercase text-xs animate-pulse font-mono">Loading Docs...</p>
                        </div>
                    ) : letterheads.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="bg-amber-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <FileText className="w-10 h-10 text-amber-500/50" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">No Letterheads Found</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">Create your first official document to get started.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-amber-50/50 dark:bg-amber-900/10 border-b-[2.5px] border-black dark:border-white/90">
                                    <tr>
                                        <th className="px-8 py-5 text-left text-xs font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest">Number</th>
                                        <th className="px-8 py-5 text-left text-xs font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest">Date</th>
                                        <th className="px-8 py-5 text-left text-xs font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest">Recipient</th>
                                        <th className="px-8 py-5 text-left text-xs font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest">Subject</th>
                                        <th className="px-8 py-5 text-left text-xs font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {letterheads.map((doc) => (
                                        <tr key={doc._id} className="hover:bg-amber-50/30 dark:hover:bg-amber-900/5 transition duration-300 group">
                                            <td className="px-8 py-6 font-bold text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                                {doc.letterheadNo}
                                            </td>
                                            <td className="px-8 py-6 text-gray-500 dark:text-gray-400 font-medium">{formatDate(doc.date)}</td>
                                            <td className="px-8 py-6">
                                                <span className="font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-white/10 px-3 py-1 rounded-full text-xs">
                                                    {doc.recipient?.name || 'Unknown'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-gray-600 dark:text-gray-300 truncate max-w-xs font-medium">{doc.subject}</td>
                                            <td className="px-8 py-6 flex items-center space-x-2">
                                                <button
                                                    onClick={() => navigate(`/letterheads/edit/${doc._id}`)}
                                                    className="p-2 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-all"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/letterheads/view/${doc._id}`)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                                                    title="Print"
                                                >
                                                    <Printer className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(doc._id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
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

export default LetterheadList;
