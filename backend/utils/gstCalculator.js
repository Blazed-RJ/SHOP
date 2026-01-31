/**
 * GST Calculator Utility
 * Handles both Inclusive and Exclusive GST calculations
 * Optimized for performance and accuracy
 */

/**
 * Round to 2 decimal places (efficient single operation)
 */
const round = (value) => Math.round(value * 100) / 100;

/**
 * Validate numeric input for calculations
 */
const validateInput = (value, name) => {
    if (!Number.isFinite(value)) {
        throw new Error(`${name} must be a valid finite number (got ${value})`);
    }
    if (value < 0) {
        throw new Error(`${name} cannot be negative (got ${value})`);
    }
};

/**
 * Calculate values from Tax-Inclusive Price (Reverse Calculation)
 * Example: MRP = ₹20,000, GST = 18%
 * Returns: { taxableValue: 16949.15, gstAmount: 3050.85, totalAmount: 20000 }
 */
export const calculateFromInclusive = (inclusivePrice, gstPercent) => {
    validateInput(inclusivePrice, 'Inclusive price');
    validateInput(gstPercent, 'GST percent');

    // Edge case: Zero GST (no calculation needed)
    if (gstPercent === 0) {
        return {
            taxableValue: round(inclusivePrice),
            gstAmount: 0,
            totalAmount: round(inclusivePrice)
        };
    }

    // Edge case: Zero price
    if (inclusivePrice === 0) {
        return {
            taxableValue: 0,
            gstAmount: 0,
            totalAmount: 0
        };
    }

    const gstRate = gstPercent / 100;
    const divisor = 1 + gstRate;

    // Prevent division by zero (though mathematically gstRate >= 0)
    if (divisor === 0) {
        throw new Error('Invalid GST calculation: divisor is zero');
    }

    // Calculate values (delay rounding to end for accuracy)
    const taxableValue = inclusivePrice / divisor;
    const gstAmount = inclusivePrice - taxableValue;

    return {
        taxableValue: round(taxableValue),
        gstAmount: round(gstAmount),
        totalAmount: round(inclusivePrice)
    };
};

/**
 * Calculate values from Tax-Exclusive Price
 * Example: Base Price = ₹16,949.15, GST = 18%
 * Returns: { taxableValue: 16949.15, gstAmount: 3050.85, totalAmount: 20000 }
 */
export const calculateFromExclusive = (basePrice, gstPercent) => {
    validateInput(basePrice, 'Base price');
    validateInput(gstPercent, 'GST percent');

    // Edge case: Zero GST
    if (gstPercent === 0) {
        return {
            taxableValue: round(basePrice),
            gstAmount: 0,
            totalAmount: round(basePrice)
        };
    }

    // Edge case: Zero price
    if (basePrice === 0) {
        return {
            taxableValue: 0,
            gstAmount: 0,
            totalAmount: 0
        };
    }

    const gstRate = gstPercent / 100;

    // Calculate values (delay rounding for accuracy)
    const taxableValue = basePrice;
    const gstAmount = basePrice * gstRate;
    const totalAmount = basePrice + gstAmount;

    // Overflow protection (sanity check for very large numbers)
    if (!Number.isFinite(totalAmount)) {
        throw new Error('GST calculation overflow: result exceeds maximum safe number');
    }

    return {
        taxableValue: round(taxableValue),
        gstAmount: round(gstAmount),
        totalAmount: round(totalAmount)
    };
};

/**
 * Calculate total for invoice line item
 */
export const calculateLineTotal = (quantity, pricePerUnit, gstPercent, isTaxInclusive = true) => {
    validateInput(quantity, 'Quantity');
    validateInput(pricePerUnit, 'Price per unit');
    validateInput(gstPercent, 'GST percent');

    const subtotal = quantity * pricePerUnit;

    // Overflow check
    if (!Number.isFinite(subtotal)) {
        throw new Error('Line total calculation overflow');
    }

    if (isTaxInclusive) {
        return calculateFromInclusive(subtotal, gstPercent);
    } else {
        return calculateFromExclusive(subtotal, gstPercent);
    }
};

/**
 * Calculate invoice summary from multiple line items
 * Optimized to reduce accumulation errors
 */
export const calculateInvoiceSummary = (items) => {
    if (!Array.isArray(items) || items.length === 0) {
        return {
            totalTaxable: 0,
            totalGST: 0,
            grandTotal: 0
        };
    }

    // Use higher precision during accumulation
    let totalTaxable = 0;
    let totalGST = 0;
    let grandTotal = 0;

    items.forEach((item, index) => {
        // Validate item structure
        if (!item || typeof item !== 'object') {
            throw new Error(`Item ${index + 1} is invalid`);
        }

        const { taxableValue, gstAmount, totalAmount } = item;

        // Validate required fields
        if (!Number.isFinite(taxableValue) || !Number.isFinite(gstAmount) || !Number.isFinite(totalAmount)) {
            throw new Error(`Item ${index + 1} has invalid calculated values`);
        }

        totalTaxable += taxableValue;
        totalGST += gstAmount;
        grandTotal += totalAmount;
    });

    // Final overflow check
    if (!Number.isFinite(grandTotal)) {
        throw new Error('Invoice summary calculation overflow');
    }

    return {
        totalTaxable: round(totalTaxable),
        totalGST: round(totalGST),
        grandTotal: round(grandTotal)
    };
};
