import mongoose from 'mongoose';

const supplierSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    company: {
        type: String,
        default: ''
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
        default: 0 // Positive = We owe supplier
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true // IST timezone
});

const Supplier = mongoose.model('Supplier', supplierSchema);
export default Supplier;
