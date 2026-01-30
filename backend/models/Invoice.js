import mongoose from 'mongoose';

const invoiceSchema = mongoose.Schema({
    invoiceNo: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        enum: ['Tax Invoice', 'Estimate', 'Challan', 'Bill of Supply'],
        default: 'Tax Invoice'
    },
    invoiceDate: {
        type: Date,
        default: Date.now
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: false // Allow ad-hoc customers
    },
    // Ad-Hoc Customer Details (Snapshot)
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerAddress: String,
    customerGstin: String, // Optional GSTIN for customer
    // Snapshot of Shop Details (Editable per invoice)
    sellerDetails: {
        storeName: String,
        address: String,
        phone: String,
        email: String,
        gstin: String,
        bankDetails: String,
        upiId: String,
        tagline: String,
        // Added for custom invoice footer control
        termsAndConditions: String,
        invoiceFooterText: String,
        authSignLabel: String,
        digitalSignature: String,
        website: String
    },
    // Invoice Items with flexible GST per row
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        itemName: { // Allow manual override
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        pricePerUnit: { // Allow manual override
            type: Number,
            required: true
        },
        gstPercent: { // Per-row GST dropdown
            type: Number,
            required: true,
            enum: [0, 5, 12, 18, 28]
        },
        isTaxInclusive: {
            type: Boolean,
            default: true
        },
        imei: { // Primary IMEI / Serial
            type: String
        },
        imei2: { // Secondary IMEI (Dual SIM)
            type: String
        },
        serialNumber: { // For non-phone items (Watch, Buds)
            type: String
        },
        taxableValue: Number,
        gstAmount: Number,
        totalAmount: Number
    }],
    // Split Payment Support
    payments: [{
        method: {
            type: String,
            enum: ['Cash', 'UPI', 'Card', 'Bank Transfer'],
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        reference: String // UPI transaction ID, etc.
    }],
    // Summary
    totalTaxable: {
        type: Number,
        required: true
    },
    totalGST: {
        type: Number,
        required: true
    },
    grandTotal: {
        type: Number,
        required: true
    },
    paidAmount: {
        type: Number,
        default: 0
    },
    dueAmount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['Paid', 'Partial', 'Due', 'Void'],
        default: 'Paid'
    },
    // Soft Delete / Void Fields
    voidReason: String,
    voidedAt: Date,
    voidedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    notes: {
        type: String,
        default: ''
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
}, {
    timestamps: true // IST timezone
});

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
