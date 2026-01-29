import mongoose from 'mongoose';

const ledgerEntrySchema = mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    date: {
        type: Date,
        default: Date.now,
        required: true
    },
    refType: {
        type: String,
        enum: ['Invoice', 'Payment', 'Return', 'Reversal', 'Opening Balance'],
        required: true
    },
    refId: {
        type: mongoose.Schema.Types.ObjectId,
        // Dynamic ref not strictly enforced here, but usually Refers to Invoice or Payment
        default: null
    },
    refNo: {
        type: String, // Invoice Number or Payment Ref
        default: ''
    },
    description: {
        type: String,
        required: true
    },
    debit: {
        type: Number,
        default: 0 // Increase in Due (Sale)
    },
    credit: {
        type: Number,
        default: 0 // Decrease in Due (Payment)
    },
    balance: {
        type: Number,
        required: true // Running Balance Snapshot
    }
}, {
    timestamps: true
});

// Index for fast retrieval by customer and date
ledgerEntrySchema.index({ customer: 1, date: 1 });

const LedgerEntry = mongoose.model('LedgerEntry', ledgerEntrySchema);
export default LedgerEntry;
