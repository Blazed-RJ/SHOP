
import mongoose from 'mongoose';

const batchSchema = mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product'
    },
    batchNumber: {
        type: String,
        required: true,
        trim: true
    },
    expiryDate: {
        type: Date,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 0
    },
    mrp: {
        type: Number,
        default: 0
    },
    purchaseRate: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Compound index for unique batch per product per user
batchSchema.index({ product: 1, batchNumber: 1, user: 1 }, { unique: true });

const Batch = mongoose.model('Batch', batchSchema);

export default Batch;
