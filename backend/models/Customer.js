import mongoose from 'mongoose';

const customerSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
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
        default: 0 // Positive = Customer owes us (Udhaar)
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
    timestamps: true // IST timezone
});

// Index for multi-tenant uniqueness and lookup
customerSchema.index({ phone: 1, user: 1 }, { unique: true });
customerSchema.index({ name: 'text' });

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;
