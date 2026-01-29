/**
 * Generate WhatsApp click-to-chat URL with invoice details
 */
export const generateWhatsAppLink = (phoneNumber, invoiceNo, amount, customerName) => {
    // Remove any special characters from phone number
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');

    // Add country code if not present (India: +91)
    const fullPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

    // Create message
    const message = `Hello ${customerName},\n\nThank you for your purchase!\n\nInvoice No: ${invoiceNo}\nAmount: ₹${amount}\n\nFor any queries, please feel free to contact us.`;

    const encodedMessage = encodeURIComponent(message);

    return `https://wa.me/${fullPhone}?text=${encodedMessage}`;
};

/**
 * Open WhatsApp with invoice details
 */
export const shareOnWhatsApp = (phoneNumber, invoiceNo, amount, customerName) => {
    const link = generateWhatsAppLink(phoneNumber, invoiceNo, amount, customerName);
    window.open(link, '_blank');
};
