import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import {
    X,
    Plus,
    ChevronRight,
    ChevronDown,
    Edit2,
    Trash2,
    FolderTree,
    ChevronUp,
    FolderPlus
} from 'lucide-react';
import toast from 'react-hot-toast';

const CategoryManagementModal = ({ onClose }) => {
    const [categories, setCategories] = useState([]);
    const [expandedCategories, setExpandedCategories] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [newCategory, setNewCategory] = useState({ name: '', description: '' });
    const [editingCategory, setEditingCategory] = useState(null);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [selectedParent, setSelectedParent] = useState(null);
    const [editParentId, setEditParentId] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState({
        isOpen: false,
        categoryId: null,
        categoryName: '',
        hasSubCategories: false,
        subCount: 0,
        isSubCategory: false
    });
    const [subInputs, setSubInputs] = useState({});

    const loadCategories = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/categories?parent=null');

            const categoriesWithSubs = await Promise.all(
                data.map(async (cat) => {
                    const { data: details } = await api.get(`/categories/${cat._id}`);
                    return details;
                })
            );

            setCategories(categoriesWithSubs);

            // Sync selectedParent if it exists
            if (selectedParent) {
                const updatedParent = categoriesWithSubs.find(c => c._id === selectedParent._id);
                if (updatedParent) {
                    setSelectedParent(updatedParent);
                }
            }

            setLoading(false);
        } catch (error) {
            console.error('Failed to load categories:', error);
            toast.error('Failed to load categories');
            setLoading(false);
        }
    }, [selectedParent]);

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    const handleSaveCategory = async (e) => {
        if (e) e.preventDefault();

        if (!newCategory.name.trim()) {
            toast.error('Category name is required');
            return;
        }

        try {
            if (editingCategory) {
                await api.put(`/categories/${editingCategory._id}`, {
                    name: newCategory.name,
                    description: newCategory.description,
                    parentCategory: editParentId
                });
                toast.success('Category updated successfully');
            } else {
                await api.post('/categories', {
                    name: newCategory.name,
                    description: newCategory.description,
                    parentCategory: selectedParent?._id,
                });
                toast.success(
                    selectedParent
                        ? 'Sub-category created successfully'
                        : 'Category created successfully'
                );
            }

            setNewCategory({ name: '', description: '' });
            setEditingCategory(null);
            setIsCreatingNew(false);
            // We keep selectedParent if we just added a sub-category under it
            loadCategories();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save category');
        }
    };

    const handleAddSubCategory = async (parentId) => {
        const name = subInputs[parentId]?.trim();
        if (!name) return;

        try {
            await api.post('/categories', {
                name,
                parentCategory: parentId
            });
            toast.success('Sub-category added');
            setSubInputs({ ...subInputs, [parentId]: '' });
            loadCategories();
        } catch (error) {
            toast.error('Failed to add sub-category');
        }
    };

    const handleEditClick = (category, parentId) => {
        setEditingCategory(category);
        setEditParentId(parentId);
        setIsCreatingNew(false);
        setNewCategory({
            name: category.name,
            description: category.description || ''
        });
    };

    const handleCancelEdit = () => {
        setEditingCategory(null);
        setIsCreatingNew(false);
        setNewCategory({ name: '', description: '' });
        setEditParentId(null);
    };

    const initiateDelete = (cat, isSubCategory = false) => {
        setDeleteConfirm({
            isOpen: true,
            categoryId: cat._id,
            categoryName: cat.name,
            hasSubCategories: cat.subCategories?.length > 0,
            subCount: cat.subCategories?.length || 0,
            isSubCategory
        });
    };

    const confirmDelete = async () => {
        const { categoryId } = deleteConfirm;
        if (!categoryId) return;

        try {
            const { data } = await api.delete(`/categories/${categoryId}`);

            if (data.subCategoriesDeleted > 0) {
                toast.success(`Category and ${data.subCategoriesDeleted} sub-categor${data.subCategoriesDeleted === 1 ? 'y' : 'ies'} deleted successfully`);
            } else {
                toast.success(deleteConfirm.isSubCategory ? 'Sub-category deleted successfully' : 'Category deleted successfully');
            }

            if (selectedParent?._id === categoryId) {
                setSelectedParent(null);
            }
            loadCategories();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete category');
        } finally {
            setDeleteConfirm({ isOpen: false, categoryId: null, categoryName: '', hasSubCategories: false, subCount: 0, isSubCategory: false });
        }
    };

    const handleCategoryClick = (cat) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(cat._id)) {
            newExpanded.delete(cat._id);
        } else {
            newExpanded.add(cat._id);
        }
        setExpandedCategories(newExpanded);

        // Select it for management
        setSelectedParent(cat);
        setIsCreatingNew(false);
        setEditingCategory(null);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50 rounded-t-xl">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <FolderTree className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            Manage Categories
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Organize your product inventory structure</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500 dark:text-gray-400"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">

                    {/* Sidebar / List */}
                    <div className="w-full md:w-1/3 border-r border-gray-100 dark:border-gray-700 overflow-y-auto p-4 bg-gray-50/30 dark:bg-gray-800/30">
                        <div className="mb-4">
                            <button
                                onClick={() => {
                                    setEditingCategory(null);
                                    setIsCreatingNew(true);
                                    setNewCategory({ name: '', description: '' });
                                    setSelectedParent(null);
                                }}
                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 shadow-sm shadow-blue-200 dark:shadow-none transition-all"
                            >
                                <Plus className="w-4 h-4" /> New Main Category
                            </button>
                        </div>

                        <div className="space-y-3">
                            {loading && categories.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 dark:text-gray-500">Loading...</div>
                            ) : categories.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">No categories yet</div>
                            ) : (
                                categories.map(cat => (
                                    <div key={cat._id} className="group">
                                        <div
                                            onClick={() => handleCategoryClick(cat)}
                                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border ${selectedParent?._id === cat._id
                                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                                : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'
                                                }`}
                                        >
                                            <span className={`font-medium ${selectedParent?._id === cat._id ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200'}`}>
                                                {cat.name}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-300 px-1.5 py-0.5 rounded-md">
                                                    {cat.subCategories?.length || 0}
                                                </span>
                                                {expandedCategories.has(cat._id) ? <ChevronUp className="w-4 h-4 text-blue-500" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                            </div>
                                        </div>

                                        {/* Action Buttons for Main Category (visible on hover or if expanded) */}
                                        <div className={`px-2 py-1 flex justify-end gap-2 text-xs transition-opacity ${expandedCategories.has(cat._id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 h-0 hidden group-hover:block group-hover:h-auto'}`}>
                                            <button onClick={(e) => { e.stopPropagation(); handleEditClick(cat, null); }} className="text-blue-600 dark:text-blue-400 hover:underline">Edit</button>
                                            <button onClick={(e) => { e.stopPropagation(); initiateDelete(cat); }} className="text-red-600 dark:text-red-400 hover:underline">Delete</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Main View */}
                    <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-gray-800">
                        {(editingCategory || isCreatingNew) ? (
                            <div className="max-w-md mx-auto mt-10">
                                <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-xl border border-blue-100 dark:border-blue-800/30 text-center">
                                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                        {editingCategory ? <Edit2 className="w-6 h-6" /> : <FolderPlus className="w-6 h-6" />}
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                        {editingCategory ? 'Edit Category' : 'Create New Category'}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                        {editingCategory ? 'Update the category name below.' : 'Add a new main category to organize your products.'}
                                    </p>

                                    <form onSubmit={handleSaveCategory} className="space-y-4 text-left">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">Category Name</label>
                                            <input
                                                type="text"
                                                value={newCategory.name}
                                                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                                placeholder="e.g., Electronics"
                                                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={handleCancelEdit}
                                                className="flex-1 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={!newCategory.name.trim()}
                                                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                {editingCategory ? 'Update' : 'Create'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        ) : selectedParent ? (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedParent.name}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage sub-categories</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEditClick(selectedParent, null)}
                                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                            title="Edit Name"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => initiateDelete(selectedParent)}
                                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Delete Category"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Add Sub Category Input */}
                                <div className="mb-6 flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            value={subInputs[selectedParent._id] || ''}
                                            onChange={(e) => setSubInputs({ ...subInputs, [selectedParent._id]: e.target.value })}
                                            placeholder="Add new sub-category..."
                                            className="w-full pl-4 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddSubCategory(selectedParent._id)}
                                        />
                                        <button
                                            onClick={() => handleAddSubCategory(selectedParent._id)}
                                            disabled={!subInputs[selectedParent._id]?.trim()}
                                            className="absolute right-1.5 top-1.5 p-1.5 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-500 dark:hover:text-white rounded-md transition-colors disabled:opacity-50 disabled:hover:bg-gray-100 disabled:hover:text-gray-600"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Sub Categories List */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                        Sub Categories ({selectedParent.subCategories?.length || 0})
                                    </h4>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {!selectedParent.subCategories || selectedParent.subCategories.length === 0 ? (
                                            <div className="col-span-full py-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50">
                                                <p className="text-gray-400 dark:text-gray-500 text-sm">No sub-categories added yet.</p>
                                            </div>
                                        ) : (
                                            selectedParent.subCategories.map((subCat, idx) => (
                                                <div key={idx} className="group flex items-center justify-between p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-500 transition-all">
                                                    <span className="text-gray-700 dark:text-gray-200 font-medium">{subCat.name}</span>
                                                    <button
                                                        onClick={() => initiateDelete(subCat, true)}
                                                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 dark:text-gray-500">
                                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                                    <FolderTree className="w-10 h-10 text-gray-300 dark:text-gray-500" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300">Select a Category</h3>
                                <p className="text-sm max-w-xs mx-auto mt-2">
                                    Select a category from the sidebar to manage its sub-categories or create a new one.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                {deleteConfirm.isOpen && (
                    <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in duration-200 border border-gray-200 dark:border-gray-700">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white mb-2">Delete {deleteConfirm.isSubCategory ? 'Sub-Category' : 'Category'}?</h3>
                            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">
                                Are you sure you want to delete <span className="font-bold text-gray-800 dark:text-gray-200">"{deleteConfirm.categoryName}"</span>?
                                {deleteConfirm.hasSubCategories && (
                                    <span className="block mt-2 text-red-500 dark:text-red-400 text-xs bg-red-50 dark:bg-red-900/20 py-1 px-2 rounded">
                                        Warning: This will delete {deleteConfirm.subCount} sub-categor{deleteConfirm.subCount === 1 ? 'y' : 'ies'}.
                                    </span>
                                )}
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirm({ isOpen: false, categoryId: null, categoryName: '', hasSubCategories: false, subCount: 0, isSubCategory: false })}
                                    className="flex-1 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-sm shadow-red-200 dark:shadow-none transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CategoryManagementModal;
