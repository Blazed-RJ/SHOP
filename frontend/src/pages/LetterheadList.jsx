import React, { useState, useEffect } from 'react';
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

    useEffect(() => {
        loadLetterheads();
    }, [searchTerm]);

    const loadLetterheads = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/letterheads?search=${searchTerm}`);
            setLetterheads(data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load letterheads');
            setLoading(false);
        }
    };

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
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Letterheads</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your official correspondence</p>
                    </div>
                    <button
                        onClick={() => navigate('/letterheads/create')}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Create New</span>
                    </button>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by subject, recipient..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400"
                    />
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {loading ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading...</div>
                    ) : letterheads.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>No letterheads found.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Number</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Recipient</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Subject</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {letterheads.map((doc) => (
                                        <tr key={doc._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{doc.letterheadNo}</td>
                                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{formatDate(doc.date)}</td>
                                            <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                                                {doc.recipient?.name || 'Unknown'}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300 truncate max-w-xs">{doc.subject}</td>
                                            <td className="px-6 py-4 flex items-center space-x-3">
                                                <button
                                                    onClick={() => navigate(`/letterheads/edit/${doc._id}`)}
                                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300" title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/letterheads/view/${doc._id}`)}
                                                    className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200" title="Print"
                                                >
                                                    <Printer className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(doc._id)}
                                                    className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300" title="Delete"
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
