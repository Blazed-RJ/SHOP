import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, ArrowUpDown, CheckSquare, Square } from 'lucide-react';
import { formatINR } from '../../utils/currency';

const InventoryTable = ({ products, loading, onEdit, onDelete, onBulkDelete, sortConfig, onSort }) => {
    const [selectedIds, setSelectedIds] = useState(new Set());

    // Clear selection if products change (e.g., after filter or delete)
    useEffect(() => {
        setSelectedIds(new Set());
    }, [products]);

    const handleSelectAll = () => {
        if (selectedIds.size === products.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(products.map(p => p._id)));
        }
    };

    const handleSelectOne = (id) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-brand-100 dark:border-gray-700 p-12 text-center">
                <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400">Loading inventory...</p>
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-brand-100 dark:border-gray-700 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">📦</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Products Found</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                    Try adjusting your search or filters, or add a new product to your inventory.
                </p>
            </div>
        );
    }

    const getClassNamesFor = (name) => {
        if (!sortConfig) return;
        return sortConfig.key === name ? sortConfig.direction : undefined;
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-brand-100 dark:border-gray-700 overflow-hidden hidden md:block">
            {selectedIds.size > 0 && (
                <div className="bg-brand-50 dark:bg-brand-900/20 p-4 flex items-center justify-between border-b border-brand-100 dark:border-brand-500/20">
                    <span className="text-sm font-semibold text-brand-700 dark:text-brand-300">
                        {selectedIds.size} product{selectedIds.size > 1 ? 's' : ''} selected
                    </span>
                    <button
                        onClick={() => onBulkDelete(Array.from(selectedIds))}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/40 dark:hover:bg-red-900/60 dark:text-red-300 rounded-lg transition-colors text-sm font-medium"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete Selected</span>
                    </button>
                </div>
            )}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                            <th className="px-6 py-4 text-left">
                                <button onClick={handleSelectAll} className="text-gray-400 hover:text-brand-500 transition-colors">
                                    {selectedIds.size === products.length && products.length > 0 ? (
                                        <CheckSquare className="w-5 h-5 text-brand-500" />
                                    ) : (
                                        <Square className="w-5 h-5" />
                                    )}
                                </button>
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Product
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Category
                            </th>
                            <th
                                className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-brand-600 dark:hover:text-brand-400 group"
                                onClick={() => onSort('stock')}
                            >
                                <div className="flex items-center justify-end gap-1">
                                    Stock
                                    <ArrowUpDown className={`w-3 h-3 transition-opacity ${sortConfig.key === 'stock' ? 'opacity-100 text-brand-600' : 'opacity-0 group-hover:opacity-50'}`} />
                                </div>
                            </th>
                            <th
                                className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-brand-600 dark:hover:text-brand-400 group"
                                onClick={() => onSort('sellingPrice')}
                            >
                                <div className="flex items-center justify-end gap-1">
                                    Price
                                    <ArrowUpDown className={`w-3 h-3 transition-opacity ${sortConfig.key === 'sellingPrice' ? 'opacity-100 text-brand-600' : 'opacity-0 group-hover:opacity-50'}`} />
                                </div>
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Value
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {products.map((product) => {
                            const isLowStock = product.stock <= (product.minStockAlert || 5);
                            const isSelected = selectedIds.has(product._id);

                            return (
                                <tr
                                    key={product._id}
                                    className={`transition-colors ${isSelected ? 'bg-brand-50/50 dark:bg-brand-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => handleSelectOne(product._id)}
                                            className="text-gray-400 hover:text-brand-500 transition-colors"
                                        >
                                            {isSelected ? (
                                                <CheckSquare className="w-5 h-5 text-brand-500" />
                                            ) : (
                                                <Square className="w-5 h-5" />
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 cursor-pointer" onClick={() => handleSelectOne(product._id)}>
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-lg shadow-inner overflow-hidden">
                                                {product.image ? (
                                                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span>{product.name.charAt(0)}</span>
                                                )}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                                                    {product.sku || 'No SKU'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 cursor-pointer" onClick={() => handleSelectOne(product._id)}>
                                        <div className="flex flex-col">
                                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                                {product.category}
                                            </span>
                                            {product.subCategory && (
                                                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                                                    {product.subCategory}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right cursor-pointer" onClick={() => handleSelectOne(product._id)}>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isLowStock
                                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                            }`}>
                                            {product.stock} {isLowStock ? 'Low' : ''}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right cursor-pointer" onClick={() => handleSelectOne(product._id)}>
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            {formatINR(product.sellingPrice)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right cursor-pointer" onClick={() => handleSelectOne(product._id)}>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            {formatINR(product.stock * product.sellingPrice)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onEdit(product); }}
                                                className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-all"
                                                title="Edit Product"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDelete(product); }}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                title="Delete Product"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InventoryTable;
