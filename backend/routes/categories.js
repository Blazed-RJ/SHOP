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

        const filter = {};
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
        const category = await Category.findById(req.params.id)
            .populate('parentCategory', 'name');

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Get sub-categories
        const subCategories = await Category.find({ parentCategory: req.params.id })
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

        // Check if category with same name exists at same level
        const existingCategory = await Category.findOne({
            name,
            parentCategory: parentCategory || null,
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
            createdBy: req.user._id === 'demo123' ? null : req.user._id,
        });

        await category.save();

        res.status(201).json(category);
    } catch (error) {
        console.error('Error creating category:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/categories/:id
// @desc    Update category
// @access  Private (Admin)
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const { name, description, parentCategory } = req.body;

        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Check if new name conflicts with existing category at same level
        if (name !== category.name) {
            const existingCategory = await Category.findOne({
                name,
                parentCategory: parentCategory !== undefined ? parentCategory : category.parentCategory,
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
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Get all sub-categories recursively
        const getAllSubCategories = async (parentId) => {
            const subs = await Category.find({ parentCategory: parentId });
            let allSubs = [...subs];

            for (const sub of subs) {
                const nestedSubs = await getAllSubCategories(sub._id);
                allSubs = [...allSubs, ...nestedSubs];
            }

            return allSubs;
        };

        const subCategories = await getAllSubCategories(req.params.id);

        // Delete all sub-categories first
        for (const sub of subCategories) {
            await sub.deleteOne();
        }

        // Delete the parent category
        await category.deleteOne();

        res.json({
            message: 'Category deleted successfully',
            deletedCount: subCategories.length + 1,
            subCategoriesDeleted: subCategories.length
        });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
