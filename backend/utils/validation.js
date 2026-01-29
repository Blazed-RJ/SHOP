/**
 * Validates invoice payload structure and constraints
 * @param {Object} data - The request body
 * @returns {Array} - Array of error messages, empty if valid
 */
export const validateInvoice = (data) => {
    const errors = [];

    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
        errors.push("Invoice must contain at least one item.");
    }

    if (data.items) {
        data.items.forEach((item, index) => {
            if (!item.quantity || item.quantity <= 0) {
                errors.push(`Item ${index + 1}: Quantity must be greater than 0.`);
            }
            if (item.pricePerUnit < 0) {
                errors.push(`Item ${index + 1}: Price cannot be negative.`);
            }
        });
    }

    if (data.payments) {
        data.payments.forEach((payment, index) => {
            if (payment.amount <= 0) {
                errors.push(`Payment ${index + 1}: Amount must be greater than 0.`);
            }
        });
    }

    return errors;
};
