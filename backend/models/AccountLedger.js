
import mongoose from 'mongoose';

const accountLedgerSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AccountGroup',
        required: true
    },
    openingBalance: {
        type: Number,
        default: 0
    },
    openingBalanceType: {
        type: String,
        enum: ['Dr', 'Cr'],
        default: 'Dr'
    },
    currentBalance: {
        type: Number,
        default: 0
    },
    // Nature of the current balance
    balanceType: {
        type: String,
        enum: ['Dr', 'Cr'],
        default: 'Dr'
    },
    linkedType: {
        type: String,
        enum: ['Customer', 'Supplier', 'Bank', 'User', 'None'],
        default: 'None'
    },
    linkedId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        refPath: 'linkedType' // Dynamic reference
    },
    gstNumber: {
        type: String,
        default: ''
    },
    panNumber: {
        type: String,
        default: ''
    },
    // Contact details often needed for ledgers
    mobile: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        default: ''
    },
    address: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Compound index for unique names within a context if needed, but names should generally be unique
accountLedgerSchema.index({ name: 1 });
accountLedgerSchema.index({ group: 1 });

const AccountLedger = mongoose.model('AccountLedger', accountLedgerSchema);
export default AccountLedger;
