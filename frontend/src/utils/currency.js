/**
 * Format number as Indian Rupee
 * Example: 150000 → ₹ 1,50,000
 */
export const formatINR = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '₹ 0';

    const num = parseFloat(amount);
    const formatted = num.toLocaleString('en-IN', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
    });

    return `₹ ${formatted}`;
};

/**
 * Parse INR formatted string to number
 * Example: "₹ 1,50,000" → 150000
 */
export const parseINR = (formattedAmount) => {
    if (!formattedAmount) return 0;

    const cleaned = formattedAmount
        .replace(/₹/g, '')
        .replace(/,/g, '')
        .trim();

    return parseFloat(cleaned) || 0;
};

/**
 * Format number without currency symbol (for calculations)
 */
export const formatNumber = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '0';

    const num = parseFloat(amount);
    return num.toLocaleString('en-IN', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
    });
};
