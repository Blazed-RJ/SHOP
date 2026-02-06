import mongoose from 'mongoose';

const paymentSchema = mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        default: null // Optional: for supplier payments
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        default: null // Optional: for customer payments
    },
    invoice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invoice',
        default: null // Null if direct payment without invoice
    },
    type: {
        type: String,
        enum: ['Debit', 'Credit'], // Debit = Customer pays us OR We pay supplier, Credit = We pay customer (refund) OR Supplier pays us
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    method: {
        type: String,
        enum: ['Cash', 'UPI', 'Card', 'Cheque', 'Bank Transfer', 'Online', 'Credit'],
        required: true
    },
    reference: {
        type: String, // Transaction ID, check number, etc.
        default: ''
    },
    notes: {
        type: String,
        default: ''
    },
    name: {
        type: String, // For Expenses: "Rent", "Electricity", etc.
        default: ''
    },
    category: {
        type: String,
        enum: ['Payment', 'Receipt', 'Expense', 'Drawing'],
        default: 'Payment'
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    recordedBy: {
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

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
