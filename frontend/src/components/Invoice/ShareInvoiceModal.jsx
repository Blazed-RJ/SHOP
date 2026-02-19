
import React, { useState } from 'react';
import { X, MessageCircle, Copy, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ShareInvoiceModal = ({ isOpen, onClose, invoice }) => {
    const [phone, setPhone] = useState(invoice?.customer?.phone || '');
    const [copied, setCopied] = useState(false);

    if (!isOpen || !invoice) return null;

    const publicUrl = `${window.location.origin}/share/invoice/${invoice._id}`;
    const message = `Hello ${invoice.customer?.name || 'Customer'},\n\nHere is your Invoice *${invoice.invoiceNumber}* for *₹${invoice.grandTotal}*.\n\nYou can view and download it here: ${publicUrl}\n\nThank you for your business!`;

    const handleWhatsApp = () => {
        if (!phone) {
            toast.error('Please enter a phone number');
            return;
        }

        // Clean phone: remove spaces, dashes, ensure 91 prefix if missing but 10 digits
        let cleanPhone = phone.replace(/[^0-9]/g, '');
        if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;

        const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
        onClose();
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(publicUrl);
        setCopied(true);
        toast.success('Link copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scaleIn">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <MessageCircle className="text-brand-500" />
                        Share Invoice
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Phone Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Customer WhatsApp Number
                        </label>
                        <div className="flex gap-2">
                            <span className="flex items-center px-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 text-sm">
                                +91
                            </span>
                            <input
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Enter 10-digit number"
                                className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Preview Message */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Message Preview
                        </label>
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                            {message}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleWhatsApp}
                            className="w-full py-3 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl font-bold shadow-lg shadow-green-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <MessageCircle size={20} />
                            Send on WhatsApp
                        </button>

                        <button
                            onClick={handleCopyLink}
                            className="w-full py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                            {copied ? 'Copied!' : 'Copy Link'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShareInvoiceModal;
