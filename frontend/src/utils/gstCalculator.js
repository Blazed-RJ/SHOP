/**
 * GST Calculator - Same logic as backend
 */

export const calculateFromInclusive = (inclusivePrice, gstPercent) => {
    const gstRate = gstPercent / 100;
    const taxableValue = inclusivePrice / (1 + gstRate);
    const gstAmount = inclusivePrice - taxableValue;

    return {
        taxableValue: parseFloat(taxableValue.toFixed(2)),
        gstAmount: parseFloat(gstAmount.toFixed(2)),
        totalAmount: parseFloat(inclusivePrice.toFixed(2))
    };
};

export const calculateFromExclusive = (basePrice, gstPercent) => {
    const gstRate = gstPercent / 100;
    const taxableValue = parseFloat(basePrice.toFixed(2));
    const gstAmount = basePrice * gstRate;
    const totalAmount = basePrice + gstAmount;

    return {
        taxableValue,
        gstAmount: parseFloat(gstAmount.toFixed(2)),
        totalAmount: parseFloat(totalAmount.toFixed(2))
    };
};

export const calculateLineTotal = (quantity, pricePerUnit, gstPercent, isTaxInclusive = true) => {
    const subtotal = quantity * pricePerUnit;

    if (isTaxInclusive) {
        return calculateFromInclusive(subtotal, gstPercent);
    } else {
        return calculateFromExclusive(subtotal, gstPercent);
    }
};

export const calculateInvoiceSummary = (items) => {
    let totalTaxable = 0;
    let totalGST = 0;
    let grandTotal = 0;

    items.forEach(item => {
        const { taxableValue, gstAmount, totalAmount } = item;
        totalTaxable += taxableValue || 0;
        totalGST += gstAmount || 0;
        grandTotal += totalAmount || 0;
    });

    return {
        totalTaxable: parseFloat(totalTaxable.toFixed(2)),
        totalGST: parseFloat(totalGST.toFixed(2)),
        grandTotal: parseFloat(grandTotal.toFixed(2))
    };
};
