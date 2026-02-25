import mongoose from 'mongoose';

const supplierSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    company: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        enum: ['Supplier', 'Expense'],
        default: 'Supplier'
    },
    phone: {
        type: String,
        required: false // Optional for Expenses
    },
    email: {
        type: String,
        default: null
    },
    address: {
        type: String,
        default: ''
    },
    gstNumber: {
        type: String,
        default: null
    },
    balance: {
        type: Number,
        default: 0 // Positive = We owe supplier
    },
    // Autopay configuration (for Expense Heads)
    autopay: {
        enabled: { type: Boolean, default: false },
        amount: { type: Number, default: 0 },
        frequency: { type: String, enum: ['Monthly', 'Weekly', 'Yearly'], default: 'Monthly' },
        dueDay: { type: Number, default: 1 }, // 1-31 for monthly, 0-6 for weekly
        method: { type: String, enum: ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Cheque', 'Online'], default: 'Cash' },
        lastPaid: { type: Date, default: null },
        nextDue: { type: Date, default: null }
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
    }
}, {
    timestamps: true
});

const Supplier = mongoose.model('Supplier', supplierSchema);
export default Supplier;
