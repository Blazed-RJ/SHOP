
import React, { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const ProductForm = ({ product, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: product?.name || '',
        sku: product?.sku || '',
        category: product?.category || '',
        subCategory: product?.subCategory || '',
        subSubCategory: product?.subSubCategory || '',
        costPrice: product?.costPrice || '',
        margin: product?.margin || '',
        sellingPrice: product?.sellingPrice || '',
        stock: product?.stock || '',
        minStockAlert: product?.minStockAlert ?? 5, // Default 5, allow 0
        gstPercent: product?.gstPercent || 18,
        imei1: product?.imei1 || '',
        imei2: product?.imei2 || '',
        serialNumber: product?.serialNumber || '',
        image: product?.image || '',
        isBatchTracked: product?.isBatchTracked || false,
    });

    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [subSubCategories, setSubSubCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    // Load categories on mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data } = await api.get('/categories?parent=null');
                setCategories(data);
            } catch (error) {
                console.error('Failed to load categories', error);
            }
        };
        fetchCategories();
    }, []);

    // Load sub-categories when category changes
    useEffect(() => {
        const fetchSubCategories = async () => {
            if (!formData.category) {
                setSubCategories([]);
                setSubSubCategories([]);
                setFormData(prev => ({ ...prev, subCategory: '', subSubCategory: '' })); // Clear sub-category when main category is cleared
                return;
            }

            // Find category ID
            const selectedCat = categories.find(c => c.name === formData.category);
            if (!selectedCat) return;

            try {
                const { data } = await api.get(`/categories/${selectedCat._id}`);
                setSubCategories(data.subCategories || []);
            } catch (error) {
                console.error('Failed to load sub-categories', error);
                setSubCategories([]);
            }
        };
        fetchSubCategories();
    }, [formData.category, categories]);

    // Load sub-sub-categories when sub-category changes
    useEffect(() => {
        const fetchSubSubCategories = async () => {
            if (!formData.subCategory) {
                setSubSubCategories([]);
                setFormData(prev => ({ ...prev, subSubCategory: '' }));
                return;
            }

            // Find sub-category ID
            const selectedSubCat = subCategories.find(c => c.name === formData.subCategory);
            // console.log('🔍 Selected sub-category:', formData.subCategory, 'Found:', selectedSubCat);
            if (!selectedSubCat) return;

            try {
                // console.log('📡 Fetching sub-sub-categories for:', selectedSubCat._id);
                const { data } = await api.get(`/categories/${selectedSubCat._id}`);
                // console.log('✅ Received data:', data);
                // console.log('✅ Sub-sub-categories:', data.subCategories);
                setSubSubCategories(data.subCategories || []);
            } catch (error) {
                console.error('❌ Failed to load sub-sub-categories', error);
                setSubSubCategories([]);
            }
        };
        fetchSubSubCategories();
    }, [formData.subCategory, subCategories]);

    // Simplified Price Calculation Handlers
    const handleCostPriceChange = (e) => {
        const cp = e.target.value;
        setFormData(prev => {
            const newFormData = { ...prev, costPrice: cp };
            if (cp && prev.margin) {
                const sp = parseFloat(cp) + (parseFloat(cp) * parseFloat(prev.margin) / 100);
                newFormData.sellingPrice = sp.toFixed(2);
            }
            return newFormData;
        });
    };

    const handleMarginChange = (e) => {
        const margin = e.target.value;
        setFormData(prev => {
            const newFormData = { ...prev, margin: margin };
            if (prev.costPrice && margin) {
                const sp = parseFloat(prev.costPrice) + (parseFloat(prev.costPrice) * parseFloat(margin) / 100);
                newFormData.sellingPrice = sp.toFixed(2);
            }
            return newFormData;
        });
    };

    const handleSellingPriceChange = (e) => {
        const sp = e.target.value;
        setFormData(prev => {
            const newFormData = { ...prev, sellingPrice: sp };
            if (prev.costPrice && sp) {
                const cp = parseFloat(prev.costPrice);
                const margin = ((parseFloat(sp) - cp) / cp) * 100;
                newFormData.margin = margin.toFixed(2);
            }
            return newFormData;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (product) {
                await api.put(`/products/${product._id}`, formData);
                toast.success('Product updated successfully');
            } else {
                await api.post('/products', formData);
                toast.success('Product added successfully');
            }
            onSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save product');
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check file size (max 50MB)
        if (file.size > 50 * 1024 * 1024) {
            toast.error('Image size should be less than 50MB');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData({ ...formData, image: reader.result });
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-brand-500/40 dark:border-brand-500/30">
                <div className="px-8 py-6 border-b border-brand-500/40 dark:border-brand-500/30 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {product ? 'Edit Product' : 'Add New Product'}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Fill in the product details to add it to your inventory.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* Basic Details */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Product Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent transition-all outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                                placeholder="Enter product name"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">SKU</label>
                                <input
                                    type="text"
                                    value={formData.sku}
                                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent transition-all outline-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                                    placeholder="Auto-generated if empty"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value, subCategory: '', subSubCategory: '' })}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent transition-all outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    required
                                >
                                    <option value="">Select category</option>
                                    {categories.map(cat => (
                                        <option key={cat._id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Serial Number</label>
                            <input
                                type="text"
                                value={formData.serialNumber}
                                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent transition-all outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                                placeholder="Enter Serial Number"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">IMEI 1</label>
                                <input
                                    type="text"
                                    value={formData.imei1}
                                    onChange={(e) => setFormData({ ...formData, imei1: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent transition-all outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                                    placeholder="Enter IMEI 1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">IMEI 2</label>
                                <input
                                    type="text"
                                    value={formData.imei2}
                                    onChange={(e) => setFormData({ ...formData, imei2: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent transition-all outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                                    placeholder="Enter IMEI 2"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Sub-Category</label>
                                <select
                                    value={formData.subCategory}
                                    onChange={(e) => setFormData({ ...formData, subCategory: e.target.value, subSubCategory: '' })}
                                    className={`w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent transition-all outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${!formData.category ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={!formData.category}
                                >
                                    <option value="">Select sub-category</option>
                                    {subCategories.map(sub => (
                                        <option key={sub._id} value={sub.name}>{sub.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                {/* Sub-Sub-Category field - Third level of categorization */}
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Sub-Sub-Category</label>
                                <select
                                    value={formData.subSubCategory}
                                    onChange={(e) => setFormData({ ...formData, subSubCategory: e.target.value })}
                                    className={`w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent transition-all outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${!formData.subCategory || subSubCategories.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={!formData.subCategory || subSubCategories.length === 0}
                                >
                                    <option value="">Select sub-sub-category</option>
                                    {subSubCategories.map(subSub => (
                                        <option key={subSub._id} value={subSub.name}>{subSub.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Cost Price (₹)</label>
                                <input
                                    type="number"
                                    value={formData.costPrice}
                                    onChange={handleCostPriceChange}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent transition-all outline-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                                    placeholder="Enter cost price"
                                    required
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Margin (%)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={formData.margin}
                                        onChange={handleMarginChange}
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent transition-all outline-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                                        placeholder="e.g., 20"
                                        step="0.1"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 font-medium">%</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Selling Price (₹)</label>
                                <input
                                    type="number"
                                    value={formData.sellingPrice}
                                    onChange={handleSellingPriceChange}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent transition-all outline-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                                    placeholder="Calculated automatically"
                                    required
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Current Stock</label>
                                <input
                                    type="number"
                                    value={formData.stock}
                                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent transition-all outline-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    required
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Min Stock Alert Level</label>
                                <input
                                    type="number"
                                    value={formData.minStockAlert}
                                    onChange={(e) => setFormData({ ...formData, minStockAlert: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent transition-all outline-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    min="0"
                                />
                            </div>

                            <div>
                                <label className="flex items-center space-x-3 p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-white/5 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={formData.isBatchTracked}
                                        onChange={(e) => setFormData({ ...formData, isBatchTracked: e.target.checked })}
                                        className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                                    />
                                    <div>
                                        <span className="block text-sm font-bold text-gray-900 dark:text-white">Enable Batch & Expiry Tracking</span>
                                        <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            For Pharmacy/FMCG: Track expiry dates and batch numbers for this product.
                                        </span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">GST Rate (%)</label>
                                <select
                                    value={formData.gstPercent}
                                    onChange={(e) => setFormData({ ...formData, gstPercent: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent transition-all outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value={0}>0% (Nil Rated)</option>
                                    <option value={5}>5%</option>
                                    <option value={12}>12%</option>
                                    <option value={18}>18% (Standard)</option>
                                    <option value={28}>28% (Luxury)</option>
                                </select>
                            </div>
                        </div>

                        {/* Image Upload */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Product Image (Optional)</label>
                            <div className="flex items-center gap-4">
                                <div className={`w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-700 ${!formData.image ? 'p-4' : ''}`}>
                                    {formData.image ? (
                                        <div className="relative w-full h-full group">
                                            <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, image: null })}
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Remove Image"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-gray-400 dark:text-gray-500">
                                            <svg className="w-8 h-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors inline-flex items-center gap-2">
                                        <Upload className="w-4 h-4" />
                                        <span>Upload Image</span>
                                        <input
                                            type="file"
                                            onChange={handleImageUpload}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                    </label>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                        PNG, JPG, WEBP (max 5MB)<br />
                                        Auto-compressed to &lt;50KB for storage
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end space-x-4 pt-6 mt-6 border-t border-gray-100 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <span>{product ? 'Update Product' : 'Create Product'}</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductForm;
