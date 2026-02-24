import mongoose from 'mongoose';

const productSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    subCategory: {
        type: String,
        default: ''
    },
    subSubCategory: {
        type: String,
        default: ''
    },
    sku: {
        type: String,
        default: null
    },
    costPrice: {
        type: Number,
        required: true // Hidden from Staff users
    },
    sellingPrice: {
        type: Number,
        required: true
    },
    margin: {
        type: Number,
        default: 0
    },
    gstPercent: {
        type: Number,
        required: true,
        enum: [0, 5, 12, 18, 28] // Indian GST slabs
    },
    isTaxInclusive: {
        type: Boolean,
        default: true // MRP includes tax
    },
    isBatchTracked: {
        type: Boolean,
        default: false
    },

    stock: {
        type: Number,
        required: true,
        default: 0
    },
    minStockAlert: {
        type: Number,
        default: 5
    },
    image: {
        type: String, // Path to local file (e.g., /uploads/iphone13_idx8.jpg)
        default: null
    },
    // Smart Fields - Conditional based on category
    imei1: {
        type: String,
        default: null // Only for "Phone" category
    },
    imei2: {
        type: String,
        default: null // Only for "Phone" category (dual SIM)
    },
    serialNumber: {
        type: String,
        default: null // Only for "Watch" or "Audio" categories
    },
    description: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
}, {
    timestamps: true // IST timezone
});

// Indexes for faster searching
productSchema.index({ name: 'text', category: 'text', sku: 'text' });
productSchema.index({ sku: 1 });
productSchema.index({ imei1: 1 });
productSchema.index({ imei2: 1 });
productSchema.index({ serialNumber: 1 });
productSchema.index({ user: 1, isActive: 1, isDeleted: 1 });

// Virtual for profit (Admin only)
productSchema.virtual('profit').get(function () {
    return this.sellingPrice - this.costPrice;
});

// Ensure virtuals are included when converting to JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

const Product = mongoose.model('Product', productSchema);
export default Product;
