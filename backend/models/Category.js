import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    parentCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false, // Not required to support demo users
    },
}, {
    timestamps: true,
});

// Index for faster queries
categorySchema.index({ name: 1, parentCategory: 1 });

export default mongoose.model('Category', categorySchema);
