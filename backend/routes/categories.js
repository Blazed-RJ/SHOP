import express from 'express';
import Category from '../models/Category.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/categories
// @desc    Get all categories (with optional parent filter)
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const { parent } = req.query;

        // Filter by user's shop
        const filter = { user: req.user.ownerId };

        if (parent === 'null' || parent === '') {
            filter.parentCategory = null; // Top-level categories only
        } else if (parent) {
            filter.parentCategory = parent;
        }

        const categories = await Category.find(filter)
            .populate('parentCategory', 'name')
            .sort({ name: 1 });

        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/categories/:id
// @desc    Get category by ID with sub-categories
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const category = await Category.findOne({ _id: req.params.id, user: req.user.ownerId })
            .populate('parentCategory', 'name');

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Get sub-categories
        const subCategories = await Category.find({
            parentCategory: req.params.id,
            user: req.user.ownerId
        })
            .sort({ name: 1 });

        res.json({ ...category.toObject(), subCategories });
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/categories
// @desc    Create new category or sub-category
// @access  Private (Admin)
router.post('/', protect, admin, async (req, res) => {
    try {
        const { name, description, parentCategory } = req.body;

        // Check if category with same name exists at same level for this shop
        const existingCategory = await Category.findOne({
            name,
            parentCategory: parentCategory || null,
            user: req.user.ownerId
        });

        if (existingCategory) {
            return res.status(400).json({
                message: parentCategory
                    ? 'A sub-category with this name already exists'
                    : 'A category with this name already exists',
            });
        }

        const category = new Category({
            name,
            description,
            parentCategory: parentCategory || null,
            createdBy: req.user._id,
            user: req.user.ownerId
        });

        await category.save();

        res.status(201).json(category);
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/categories/:id
// @desc    Update category
// @access  Private (Admin)
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const { name, description, parentCategory } = req.body;

        const category = await Category.findOne({ _id: req.params.id, user: req.user.ownerId });

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Check if new name conflicts with existing category at same level in this shop
        if (name && name !== category.name) {
            const existingCategory = await Category.findOne({
                name,
                parentCategory: parentCategory !== undefined ? parentCategory : category.parentCategory,
                user: req.user.ownerId,
                _id: { $ne: req.params.id },
            });

            if (existingCategory) {
                return res.status(400).json({
                    message: 'A category with this name already exists',
                });
            }
        }

        category.name = name || category.name;
        category.description = description !== undefined ? description : category.description;
        if (parentCategory !== undefined) {
            category.parentCategory = parentCategory;
        }

        await category.save();
        await category.populate('parentCategory', 'name');

        res.json(category);
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/categories/:id
// @desc    Delete category (and all sub-categories)
// @access  Private (Admin)
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const category = await Category.findOne({ _id: req.params.id, user: req.user.ownerId });

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Helper to collect all subcategory IDs recursively
        const getSubCategoryIds = async (parentId) => {
            const subs = await Category.find({ parentCategory: parentId, user: req.user.ownerId });
            let ids = subs.map(s => s._id);

            for (const sub of subs) {
                const nestedIds = await getSubCategoryIds(sub._id);
                ids = [...ids, ...nestedIds];
            }
            return ids;
        };

        const subCategoryIds = await getSubCategoryIds(req.params.id);
        const allToDelete = [req.params.id, ...subCategoryIds];

        // Bulk delete
        const result = await Category.deleteMany({ _id: { $in: allToDelete }, user: req.user.ownerId });

        res.json({
            message: 'Category and all sub-categories deleted successfully',
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
