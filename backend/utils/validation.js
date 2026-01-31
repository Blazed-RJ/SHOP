/**
 * Validates invoice payload structure and constraints
 * @param {Object} data - The request body
 * @returns {Array} - Array of error messages, empty if valid
 */

// Allowed Indian GST slabs
const VALID_GST_RATES = [0, 5, 12, 18, 28];

// Allowed payment methods
const VALID_PAYMENT_METHODS = ['Cash', 'UPI', 'Card', 'Cheque', 'Bank Transfer', 'Online'];

export const validateInvoice = (data) => {
    const errors = [];

    // Validate items array
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
        errors.push("Invoice must contain at least one item.");
        return errors; // Early return if no items
    }

    // Validate invoice date
    if (data.invoiceDate) {
        const invoiceDate = new Date(data.invoiceDate);
        const now = new Date();

        if (isNaN(invoiceDate.getTime())) {
            errors.push("Invalid invoice date format.");
        } else if (invoiceDate > now) {
            errors.push("Invoice date cannot be in the future.");
        }
    }

    // Validate each item
    data.items.forEach((item, index) => {
        const itemNum = index + 1;

        // Item name validation
        if (!item.itemName && !item.name) {
            errors.push(`Item ${itemNum}: Item name is required.`);
        } else {
            const name = item.itemName || item.name;
            if (typeof name !== 'string' || name.trim().length === 0) {
                errors.push(`Item ${itemNum}: Item name must be a non-empty string.`);
            }
        }

        // Quantity validation - comprehensive checks
        if (item.quantity === undefined || item.quantity === null) {
            errors.push(`Item ${itemNum}: Quantity is required.`);
        } else if (!Number.isFinite(item.quantity)) {
            errors.push(`Item ${itemNum}: Quantity must be a valid finite number (not NaN or Infinity).`);
        } else if (item.quantity <= 0) {
            errors.push(`Item ${itemNum}: Quantity must be greater than 0.`);
        } else if (item.quantity > 10000) {
            errors.push(`Item ${itemNum}: Quantity seems unusually high (max 10,000).`);
        }

        // Price validation - comprehensive checks
        if (item.pricePerUnit === undefined || item.pricePerUnit === null) {
            errors.push(`Item ${itemNum}: Price per unit is required.`);
        } else if (!Number.isFinite(item.pricePerUnit)) {
            errors.push(`Item ${itemNum}: Price must be a valid finite number (not NaN or Infinity).`);
        } else if (item.pricePerUnit < 0) {
            errors.push(`Item ${itemNum}: Price cannot be negative.`);
        } else if (item.pricePerUnit === 0) {
            errors.push(`Item ${itemNum}: Price cannot be zero. Use a valid price.`);
        } else if (item.pricePerUnit > 10000000) {
            errors.push(`Item ${itemNum}: Price seems unusually high (max ₹1 crore per unit).`);
        }

        // GST percentage validation - check against Indian GST slabs
        if (item.gstPercent !== undefined && item.gstPercent !== null) {
            if (!Number.isFinite(item.gstPercent)) {
                errors.push(`Item ${itemNum}: GST percentage must be a valid finite number.`);
            } else if (!VALID_GST_RATES.includes(item.gstPercent)) {
                errors.push(`Item ${itemNum}: Invalid GST rate. Must be one of: ${VALID_GST_RATES.join(', ')}%.`);
            }
        }

        // Cost price validation (if provided)
        if (item.costPrice !== undefined && item.costPrice !== null) {
            if (!Number.isFinite(item.costPrice)) {
                errors.push(`Item ${itemNum}: Cost price must be a valid finite number.`);
            } else if (item.costPrice < 0) {
                errors.push(`Item ${itemNum}: Cost price cannot be negative.`);
            }
        }
    });

    // Validate payments array (if provided)
    if (data.payments && Array.isArray(data.payments)) {
        data.payments.forEach((payment, index) => {
            const paymentNum = index + 1;

            // Amount validation
            if (payment.amount === undefined || payment.amount === null) {
                errors.push(`Payment ${paymentNum}: Amount is required.`);
            } else if (!Number.isFinite(payment.amount)) {
                errors.push(`Payment ${paymentNum}: Amount must be a valid finite number.`);
            } else if (payment.amount <= 0) {
                errors.push(`Payment ${paymentNum}: Amount must be greater than 0.`);
            } else if (payment.amount > 100000000) {
                errors.push(`Payment ${paymentNum}: Amount seems unusually high (max ₹10 crores).`);
            }

            // Payment method validation
            if (payment.method) {
                if (typeof payment.method !== 'string') {
                    errors.push(`Payment ${paymentNum}: Payment method must be a string.`);
                } else if (!VALID_PAYMENT_METHODS.includes(payment.method)) {
                    errors.push(`Payment ${paymentNum}: Invalid payment method. Must be one of: ${VALID_PAYMENT_METHODS.join(', ')}.`);
                }
            }
        });
    }

    // Validate customer information (if provided)
    if (data.customerPhone && typeof data.customerPhone === 'string') {
        const phoneDigits = data.customerPhone.replace(/\D/g, '');
        if (phoneDigits.length !== 10) {
            errors.push("Customer phone number must be 10 digits.");
        }
    }

    if (data.customerGstin && typeof data.customerGstin === 'string') {
        // Basic GSTIN validation (15 characters)
        if (data.customerGstin.length !== 15) {
            errors.push("Customer GSTIN must be 15 characters.");
        }
    }

    return errors;
};
