
import React from 'react';
import { Plus, Download, FolderTree } from 'lucide-react';
import { formatINR } from '../../utils/currency';

const Header = ({ totalProducts, totalValue, onAddProduct, onExport, onImport, onManageCategories }) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory Management</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Manage your products, stock levels, and pricing.
                </p>
            </div>

            <div className="flex items-center gap-3">
                <div className="hidden md:block text-right mr-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Value ({totalProducts} items)</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{formatINR(totalValue)}</p>
                </div>

                <button
                    onClick={onExport}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Export</span>
                </button>

                <button
                    onClick={onImport}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Import</span>
                </button>

                <button
                    onClick={onManageCategories}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                    <FolderTree className="w-4 h-4" />
                    <span className="hidden sm:inline">Categories</span>
                </button>

                <button
                    onClick={onAddProduct}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors shadow-lg shadow-brand-500/30"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add Product</span>
                </button>
            </div>
        </div>
    );
};

export default Header;
