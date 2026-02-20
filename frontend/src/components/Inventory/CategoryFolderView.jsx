import React from 'react';
import { Folder, ChevronRight, Package, ArrowLeft } from 'lucide-react';
import { BACKEND_URL } from '../../utils/api';

const CategoryFolderView = ({
    categories = [],
    products = [],
    currentPath = [],
    onCategoryClick,
    onProductClick,
    onNavigateBack,
    onNavigateHome,
    loading
}) => {
    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-pulse">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
                ))}
            </div>
        );
    }

    if (categories.length === 0 && products.length === 0) {
        return (
            <div className="text-center py-20">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Folder className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">This folder is empty</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">No categories or products found here.</p>
                {currentPath.length > 0 && (
                    <button
                        onClick={onNavigateBack}
                        className="mt-4 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        Go Back
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-x-auto">
                <button
                    onClick={onNavigateHome}
                    className={`hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded transition-colors ${currentPath.length === 0 ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                >
                    Inventory
                </button>

                {currentPath.map((item, index) => (
                    <React.Fragment key={item.id}>
                        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <button
                            onClick={() => onNavigateBack(currentPath.length - 1 - index)} // Navigate to this specific level
                            className={`hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded transition-colors whitespace-nowrap ${index === currentPath.length - 1 ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                        >
                            {item.name}
                        </button>
                    </React.Fragment>
                ))}
            </div>

            {/* Content Grids */}
            <div className="space-y-8">
                {/* Folders Section */}
                {(categories.length > 0 || currentPath.length > 0) && (
                    <div>
                        <h4 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4 px-1">Folders</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {/* Back Folder (if deeper than root) */}
                            {currentPath.length > 0 && (
                                <div
                                    onClick={onNavigateBack}
                                    className="group flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/10 cursor-pointer transition-all duration-200"
                                >
                                    <ArrowLeft className="w-8 h-8 text-gray-400 group-hover:text-brand-500 mb-3 transition-colors" />
                                    <span className="text-sm font-medium text-gray-500 group-hover:text-brand-600 dark:text-gray-400">Back</span>
                                </div>
                            )}

                            {/* Categories (Folders) */}
                            {categories.map(category => (
                                <div
                                    key={category._id}
                                    onClick={() => onCategoryClick(category)}
                                    className="group relative flex flex-col items-center p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-brand-200 dark:hover:border-brand-700 cursor-pointer transition-all duration-200"
                                >
                                    <div className="w-16 h-16 mb-4 relative flex items-center justify-center">
                                        {category.image ? (
                                            <img
                                                src={`${BACKEND_URL}${category.image}`}
                                                alt={category.name}
                                                className="w-full h-full object-cover rounded-lg shadow-sm"
                                            />
                                        ) : (
                                            <>
                                                <Folder className="w-full h-full text-brand-100 dark:text-brand-900/30 group-hover:text-brand-200 dark:group-hover:text-brand-800/40 transition-colors" />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <Folder className="w-8 h-8 text-brand-500 dark:text-brand-400" />
                                                </div>
                                            </>
                                        )}
                                        {/* Badge for item count if available */}
                                        {category.subCategories?.length > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-brand-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                                                {category.subCategories.length}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 text-center truncate w-full px-2" title={category.name}>
                                        {category.name}
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {category.subCategories?.length > 0 && `${category.subCategories.length} sub-folder${category.subCategories.length > 1 ? 's' : ''}`}
                                        {category.subCategories?.length > 0 && category.productCount > 0 && ' • '}
                                        {category.productCount > 0 && `${category.productCount} product${category.productCount > 1 ? 's' : ''}`}
                                        {(!category.subCategories?.length && !category.productCount) && 'Empty folder'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Products Section */}
                {products.length > 0 && (
                    <div>
                        <h4 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4 px-1">Products</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {/* Products (Files) */}
                            {products.map(product => (
                                <div
                                    key={product._id}
                                    onClick={() => onProductClick(product)}
                                    className="group relative flex flex-col p-0 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg hover:border-brand-300 dark:hover:border-brand-600 cursor-pointer transition-all duration-200 overflow-hidden"
                                >
                                    {/* Image/Thumbnail */}
                                    <div className="h-32 w-full bg-gray-100 dark:bg-gray-900/50 flex items-center justify-center relative overflow-hidden">
                                        {product.image ? (
                                            <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                        ) : (
                                            <Package className="w-10 h-10 text-gray-300 dark:text-gray-600 group-hover:text-brand-400 transition-colors" />
                                        )}
                                        {product.stock <= (product.minStockAlert || 5) && (
                                            <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold text-white shadow-sm ${product.stock === 0 ? 'bg-red-500' : 'bg-amber-500'}`}>
                                                {product.stock === 0 ? 'OUT' : 'LOW'}
                                            </div>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="p-3">
                                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate" title={product.name}>
                                            {product.name}
                                        </h3>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                                                ₹{product.sellingPrice}
                                            </span>
                                            <span className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                                                Qty: {product.stock}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CategoryFolderView;
