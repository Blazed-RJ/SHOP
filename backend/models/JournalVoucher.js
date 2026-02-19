
import mongoose from 'mongoose';

const journalVoucherSchema = mongoose.Schema({
    voucherNo: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now,
        required: true
    },
    type: {
        type: String,
        enum: ['Journal', 'Sales', 'Purchase', 'Payment', 'Receipt', 'Contra', 'Credit Note', 'Debit Note'],
        required: true
    },
    narration: {
        type: String,
        default: ''
    },
    entries: [{
        ledger: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AccountLedger',
            required: true
        },
        debit: {
            type: Number,
            default: 0
        },
        credit: {
            type: Number,
            default: 0
        }
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    // Optional: link to source document
    referenceType: {
        type: String,
        enum: ['Invoice', 'Bill', 'None'],
        default: 'None'
    },
    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Validation hook to ensure debits equal credits
journalVoucherSchema.pre('save', function (next) {
    if (this.entries && this.entries.length > 0) {
        let totalDebit = 0;
        let totalCredit = 0;

        this.entries.forEach(entry => {
            totalDebit += entry.debit || 0;
            totalCredit += entry.credit || 0;
        });

        // Use a small epsilon for floating point comparison if needed, 
        // but for currency strictly handled as numbers, exact match is usually expected or within 0.01
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            return next(new Error(`Voucher imbalance: Total Debit (${totalDebit}) does not equal Total Credit (${totalCredit})`));
        }

        this.totalAmount = totalDebit; // Or totalCredit, they are same
    }
    next();
});

journalVoucherSchema.index({ date: 1 });
journalVoucherSchema.index({ type: 1 });
journalVoucherSchema.index({ voucherNo: 1 });

// Index for faster reporting (filtering by date and grouping by ledger)
journalVoucherSchema.index({ 'entries.ledger': 1, date: 1 });

const JournalVoucher = mongoose.model('JournalVoucher', journalVoucherSchema);
export default JournalVoucher;
