import mongoose from 'mongoose';

// Counter schema for atomic invoice number generation
const counterSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    year: {
        type: Number,
        required: true
    },
    sequence: {
        type: Number,
        default: 0
    }
});

const Counter = mongoose.model('Counter', counterSchema);

/**
 * Generate next invoice number atomically
 * Format: INV-2026-0001
 * Uses findOneAndUpdate to prevent race conditions
 */
export const generateInvoiceNumber = async () => {
    const currentYear = new Date().getFullYear();
    const counterName = 'invoice';

    // Atomic increment using findOneAndUpdate
    const counter = await Counter.findOneAndUpdate(
        { name: counterName, year: currentYear },
        { $inc: { sequence: 1 } },
        {
            new: true, // Return updated document
            upsert: true, // Create if doesn't exist
            setDefaultsOnInsert: true
        }
    );

    // Format: INV-2026-0001
    const invoiceNumber = `INV-${currentYear}-${String(counter.sequence).padStart(4, '0')}`;

    return invoiceNumber;
};

export default Counter;
