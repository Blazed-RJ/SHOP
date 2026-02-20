
import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';
import { ChevronRight, ChevronDown, Folder, FileText, Plus } from 'lucide-react';

const ChartOfAccounts = () => {
    const [tree, setTree] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState({});

    useEffect(() => {
        const fetchChart = async () => {
            try {
                const { data } = await api.get('/accounting/chart-of-accounts');
                setTree(data);
                setLoading(false);
            } catch (error) {
                console.error(error);
                toast.error('Failed to load Chart of Accounts');
                setLoading(false);
            }
        };

        fetchChart();
    }, []);

    const toggleExpand = (id) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const TreeNode = ({ node, level = 0 }) => {
        const isGroup = !!node.children; // It's a group if it has children array (even if empty)
        const hasChildren = isGroup && (node.children.length > 0 || node.ledgers?.length > 0);
        const isOpen = expanded[node._id];

        const paddingLeft = level * 20 + 'px';

        return (
            <div>
                <div
                    className={`flex items-center py-2 px-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-100 dark:border-gray-800 text-sm`}
                    style={{ paddingLeft }}
                    onClick={() => hasChildren && toggleExpand(node._id)}
                >
                    {hasChildren ? (
                        isOpen ? <ChevronDown size={14} className="mr-2 text-gray-500" /> : <ChevronRight size={14} className="mr-2 text-gray-500" />
                    ) : (
                        <div className="w-[14px] mr-2"></div>
                    )}

                    {isGroup ? (
                        <Folder size={16} className="mr-2 text-blue-500 fill-blue-100 dark:fill-blue-900" />
                    ) : (
                        <FileText size={16} className="mr-2 text-green-500" />
                    )}

                    <span className={`flex-1 ${isGroup ? 'font-bold text-gray-800 dark:text-gray-200' : 'text-gray-600 dark:text-gray-400'}`}>
                        {node.name}
                        {isGroup && node.nature && <span className="ml-2 text-[10px] bg-gray-200 dark:bg-gray-700 px-1 rounded text-gray-500">{node.nature}</span>}
                    </span>

                    <span className="font-mono text-gray-900 dark:text-white">
                        {/* Recursive balance calculation could go here, or handled by backend */}
                    </span>

                    {isGroup && (
                        <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded ml-2" title="Add Sub-Group or Ledger">
                            <Plus size={12} />
                        </button>
                    )}
                </div>

                {isOpen && hasChildren && (
                    <div>
                        {node.children?.map(child => (
                            <TreeNode key={child._id} node={child} level={level + 1} />
                        ))}
                        {node.ledgers?.map(ledger => (
                            <div
                                key={ledger._id}
                                className="flex items-center py-2 px-2 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 text-sm"
                                style={{ paddingLeft: (level + 1) * 20 + 'px' }}
                            >
                                <div className="w-[14px] mr-2"></div>
                                <FileText size={16} className="mr-2 text-green-500" />
                                <span className="flex-1 text-gray-600 dark:text-gray-400">
                                    {ledger.name}
                                </span>
                                <span className="font-mono text-gray-900 dark:text-gray-300 text-xs">
                                    {ledger.currentBalance?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                    <span className="ml-1 text-[10px] text-gray-500">{ledger.balanceType}</span>
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    if (loading) return <div className="p-8 text-center">Loading Chart of Accounts...</div>;

    return (
        <div className="p-6 bg-white dark:bg-black min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chart of Accounts</h1>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
                    <Plus size={18} />
                    Create Group/Ledger
                </button>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 font-bold text-gray-500 text-xs uppercase tracking-wider flex justify-between">
                    <span>Account Name</span>
                    <span>Balance</span>
                </div>
                <div>
                    {tree.map(group => (
                        <TreeNode key={group._id} node={group} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ChartOfAccounts;
