import mongoose from 'mongoose';

const supplierLedgerEntrySchema = mongoose.Schema({
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: true
    },
    date: {
        type: Date,
        default: Date.now,
        required: true
    },
    refType: {
        type: String,
        enum: ['Purchase', 'Payment', 'Return', 'Reversal', 'Opening Balance'],
        required: true
    },
    refId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    refNo: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        required: true
    },
    debit: {
        type: Number,
        default: 0 // Payments OUT (decreases liability)
    },
    credit: {
        type: Number,
        default: 0 // Purchases IN (increases liability)
    },
    balance: {
        type: Number,
        required: true // Running Balance (Amount we owe supplier)
    },
    billAttachment: {
        type: String, // File path to uploaded bill
        default: ''
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Index for fast retrieval
supplierLedgerEntrySchema.index({ supplier: 1, date: 1 });

const SupplierLedgerEntry = mongoose.model('SupplierLedgerEntry', supplierLedgerEntrySchema);
export default SupplierLedgerEntry;
