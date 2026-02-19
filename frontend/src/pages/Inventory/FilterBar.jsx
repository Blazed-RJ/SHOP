
import React from 'react';
import { Search, Filter, RefreshCw, ChevronDown, LayoutGrid, List } from 'lucide-react';

const FilterBar = ({
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    stockFilter,
    setStockFilter,
    categories,
    totalProducts,
    onRefresh,
    viewMode,
    setViewMode
}) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-brand-100 dark:border-gray-700 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search products by name, SKU, or category..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                    />
                </div>

                {/* Filters Group */}
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Category Filter */}
                    <div className="relative min-w-[180px]">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none appearance-none bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 cursor-pointer"
                        >
                            <option value="All">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat._id} value={cat.name}>{cat.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                    </div>

                    {/* Stock Filter */}
                    <div className="relative min-w-[160px]">
                        <select
                            value={stockFilter}
                            onChange={(e) => setStockFilter(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none appearance-none bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 cursor-pointer"
                        >
                            <option value="all">All Stock Status</option>
                            <option value="low">Low Stock</option>
                            <option value="out">Out of Stock</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                    </div>

                    {/* Refresh Button */}
                    <button
                        onClick={onRefresh}
                        className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
                        title="Refresh List"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>

                    {/* View Mode Toggle */}
                    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                        <button
                            onClick={() => setViewMode('folder')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'folder' ? 'bg-white dark:bg-gray-600 shadow-sm text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                            title="Folder View"
                        >
                            <LayoutGrid className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                            title="List View"
                        >
                            <List className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="text-sm text-gray-500 dark:text-gray-400 self-center hidden md:block">
                        Total: {totalProducts}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilterBar;
