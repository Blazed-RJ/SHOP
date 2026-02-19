
import React from 'react';
import { Package, Edit2, Trash2, Tag, Layers, TrendingUp } from 'lucide-react';
import { formatINR } from '../../utils/currency';

const InventoryCards = ({ products, loading, onEdit, onDelete }) => {
    if (loading) return null; // Loading handled by parent or Table component

    if (products.length === 0) return null;

    return (
        <div className="grid grid-cols-1 gap-4 md:hidden">
            {products.map((product) => {
                const isLowStock = product.stock <= (product.minStockAlert || 5);
                return (
                    <div key={product._id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-brand-100 dark:border-gray-700 space-y-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xl shadow-inner overflow-hidden">
                                    {product.image ? (
                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{product.name.charAt(0)}</span>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">{product.name}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{product.sku || 'No SKU'}</p>
                                </div>
                            </div>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${isLowStock
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                }`}>
                                {product.stock} left
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-gray-700">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Price</p>
                                <p className="font-bold text-gray-900 dark:text-white">{formatINR(product.sellingPrice)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Value</p>
                                <p className="font-medium text-gray-700 dark:text-gray-300">{formatINR(product.stock * product.sellingPrice)}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
                            <Tag className="w-3 h-3" />
                            <span>{product.category}</span>
                            {product.subCategory && (
                                <>
                                    <span className="mx-1">•</span>
                                    <span>{product.subCategory}</span>
                                </>
                            )}
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                onClick={() => onEdit(product)}
                                className="flex-1 flex items-center justify-center gap-2 py-2 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors text-sm font-medium"
                            >
                                <Edit2 className="w-4 h-4" />
                                Edit
                            </button>
                            <button
                                onClick={() => onDelete(product)}
                                className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm font-medium"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default InventoryCards;
