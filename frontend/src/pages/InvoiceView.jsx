import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { BACKEND_URL } from '../utils/api';
import { useSettings } from '../context/SettingsContext';
import { formatINR } from '../utils/currency';
import { formatDate } from '../utils/date';
import { Printer, ArrowLeft, Download, Share2, Mail, FileText, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { sharePdf } from '../utils/pdfShare';

const InvoiceView = ({ isPublic = false }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { settings } = useSettings();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                const endpoint = isPublic ? `/public/invoices/${id}` : `/invoices/${id}`;
                const { data } = await api.get(endpoint);
                setInvoice(data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching invoice:', error);
                if (!isPublic) toast.error('Failed to load invoice');
                setLoading(false);
            }
        };

        if (id) {
            fetchInvoice();
        }
    }, [id, isPublic]);

    const handleShare = async (platform) => {
        if (!invoice) return;
        const fileName = `Invoice_${invoice.invoiceNo}.pdf`;
        const title = `Invoice ${invoice.invoiceNo}`;
        const text = `Please find attached invoice ${invoice.invoiceNo} from ${seller.storeName}`;

        // Passing platform is schematic here - Web Share API handles the choice on mobile
        // But we trigger the same generic share flow
        await sharePdf('invoice-content', fileName, title, text);
    };

    const handleWhatsAppShare = () => {
        if (!invoice) return;
        const shareUrl = `${window.location.origin}/share/invoice/${invoice._id}`;
        const text = `Here is your Invoice PDF link for ${invoice.invoiceNo} from ${seller.storeName}: ${shareUrl}`;

        // Use whatsappNumber from settings if available, otherwise open WhatsApp without recipient
        const whatsappNumber = settings?.whatsappNumber || '';
        const waLink = whatsappNumber
            ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`
            : `https://wa.me/?text=${encodeURIComponent(text)}`;

        window.open(waLink, '_blank');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!invoice) return null;

    // Use invoice-specific seller details if available (Snapshot), otherwise fallback to global settings
    const seller = invoice.sellerDetails || {
        storeName: settings?.storeName || settings?.shopName,
        tagline: settings?.tagline,
        address: settings?.address,
        phone: settings?.phone,
        email: settings?.email,
        gstin: settings?.gstin || settings?.gstNumber,
        website: settings?.website,
        bankDetails: (settings?.bankName && settings?.accountNumber)
            ? `${settings.bankName}, A/c: ${settings.accountNumber}, IFSC: ${settings.ifscCode}`
            : '',
        upiId: settings?.upi || settings?.upiId,
        footerFontSize: settings?.footerFontSize || 12,
        footerFontFamily: settings?.footerFontFamily || 'sans-serif',
        footerAlignment: settings?.footerAlignment || 'center',
        invoiceFooterText: settings?.invoiceFooterText || ''
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 print:p-0 print:bg-white transition-all duration-300">
            {/* Toolbar - Hidden in Print */}
            <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
                <div>
                    {!isPublic && (
                        <button
                            onClick={() => navigate('/invoices')}
                            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Back to History
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => handleShare()}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Download className="w-4 h-4" />
                        Download PDF
                    </button>
                    {!isPublic && (
                        <button
                            onClick={handleWhatsAppShare}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-sm"
                        >
                            <MessageCircle className="w-4 h-4" />
                            WhatsApp
                        </button>
                    )}
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Printer className="w-4 h-4" />
                        Print Invoice
                    </button>
                </div>
            </div>

            {/* Invoice Paper */}
            <div id="invoice-content" className="max-w-4xl mx-auto bg-white shadow-xl rounded-xl overflow-hidden print:shadow-none print:rounded-none print:a4-page-container transition-all duration-300 text-gray-900">
                {/* Header - Modern Clean Design */}
                <div className="p-4 bg-white print:bg-white transition-colors">
                    <div className="flex justify-between items-start mb-2">
                        {/* Left: Branding */}
                        <div className="flex items-center gap-3">
                            {settings?.logo && (
                                <img
                                    src={settings.logo?.startsWith?.('http') ? settings.logo : `${BACKEND_URL}${settings.logo}`}
                                    className="h-10 w-auto object-contain"
                                    alt="Logo"
                                />
                            )}
                            <div>
                                <h1 className="text-sm font-bold uppercase tracking-wider text-gray-800 leading-tight">
                                    {seller.storeName || ''}
                                </h1>
                                <p className="text-[9px] text-gray-500 tracking-[0.2em]">
                                    {seller.tagline || ''}
                                </p>
                            </div>
                        </div>

                        {/* Right: Contact & Invoice Meta */}
                        <div className="text-right">
                            <div className="mb-2">
                                <div className="font-bold text-[10px] uppercase tracking-wide text-gray-900">{invoice.invoiceType || 'TAX INVOICE'}</div>
                                <div className="text-[9px] text-gray-500">{invoice.invoiceNo}</div>
                                <div className="text-[9px] text-gray-500">{formatDate(invoice.invoiceDate || invoice.createdAt)}</div>
                            </div>

                            <div className="text-[9px] text-gray-600 space-y-0.5 font-medium">
                                {seller.address ? (
                                    <>
                                        <p>{seller.address.split(',')[0]}</p>
                                        <p>{seller.address.split(',')[1]}</p>
                                    </>
                                ) : null}
                                {seller.phone && (
                                    <div className="flex items-center justify-end gap-1.5 mt-1">
                                        <span>{seller.phone}</span>
                                        <span className="text-[8px]" style={{ color: settings?.brandColor || '#EF4444' }}>📞</span>
                                    </div>
                                )}
                                {seller.email && (
                                    <div className="flex items-center justify-end gap-1.5">
                                        <span>{seller.email}</span>
                                        <span className="text-[8px]" style={{ color: settings?.brandColor || '#EF4444' }}>✉️</span>
                                    </div>
                                )}
                                {seller.website && (
                                    <div className="flex items-center justify-end gap-1.5">
                                        <span>{seller.website}</span>
                                        <span className="text-[8px]" style={{ color: settings?.brandColor || '#EF4444' }}>🌐</span>
                                    </div>
                                )}
                                {seller.gstin && (
                                    <div className="flex items-center justify-end gap-1.5 mt-1 font-semibold">
                                        <span>GSTIN: {seller.gstin}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center mt-2 mb-1">
                        <div className="h-2 rounded-l-full w-1/3" style={{ backgroundColor: settings?.brandColor || '#EF4444' }}></div>
                        <div className="h-1 bg-black w-2/3 rounded-r-full"></div>
                    </div>
                </div>

                {/* From/To Section */}
                <div className="p-3 grid grid-cols-2 gap-3 border-b-[2.5px] border-black">
                    <div>
                        <div className="text-[8px] font-semibold text-gray-600 mb-0.5">From:</div>
                        <p className="text-[10px] font-semibold text-gray-900">{seller.storeName || ''}</p>
                        <p className="text-[9px] text-gray-700">{seller.address || ''}</p>
                        <p className="text-[9px] text-gray-700">{seller.phone}</p>
                    </div>
                    <div>
                        <div className="text-[8px] font-semibold text-gray-600 mb-0.5">To:</div>
                        <p className="text-[10px] font-semibold text-gray-900">
                            {(invoice.customer && invoice.customer.name)
                                ? invoice.customer.name
                                : (invoice.customerName || 'Walk-in Customer')}
                        </p>
                        <p className="text-[9px] text-gray-700">{invoice.customerPhone || 'No Phone'}</p>
                        {(invoice.customer?.address || invoice.customerAddress) && <p className="text-[9px] text-gray-700">{invoice.customer?.address || invoice.customerAddress}</p>}
                        {(invoice.customer?.gstin || invoice.customerGstin) && <p className="text-[9px] text-gray-700 font-semibold">GSTIN: {invoice.customer?.gstin || invoice.customerGstin}</p>}
                    </div>
                </div>

                {/* Items Table */}
                <div className="p-6">
                    <table className="w-full text-[9px]">
                        <thead>
                            <tr className="text-white" style={{ backgroundColor: settings?.brandColor || '#1e3a8a' }}>
                                <th className="py-1.5 px-2 text-left w-10">#</th>
                                <th className="py-1.5 px-2 text-left">Item</th>
                                <th className="py-1.5 px-2 text-center w-16">Qty</th>
                                <th className="py-1.5 px-2 text-right w-24">Rate</th>
                                <th className="py-1.5 px-2 text-center w-20">GST %</th>
                                <th className="py-1.5 px-2 text-right w-24">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 print:divide-gray-200">
                            {invoice.items.map((item, index) => (
                                <tr className="hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors">
                                    <td className="py-2 px-2 text-gray-500 align-top">{index + 1}</td>
                                    <td className="py-2 px-2 align-top">
                                        <div className="font-medium text-gray-900">{item.productName || item.itemName}</div>
                                        {/* IMEI/Serial Display */}
                                        {(item.imei || item.imei2 || item.serialNumber) && (
                                            <div className="text-[7px] text-gray-500 mt-0.5 space-y-0.5">
                                                {item.imei && <span>IMEI 1: {item.imei} </span>}
                                                {item.imei2 && <span>IMEI 2: {item.imei2} </span>}
                                                {item.serialNumber && <span>SN: {item.serialNumber}</span>}
                                            </div>
                                        )}
                                        {item.isCustom && (
                                            <span className="inline-block mt-0.5 text-[7px] bg-blue-50 text-blue-600 px-1 py-0.2 rounded">
                                                Custom
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-2 px-2 text-center text-gray-700 align-top">{item.quantity}</td>
                                    <td className="py-2 px-2 text-right text-gray-700 align-top">{formatINR(item.pricePerUnit)}</td>
                                    <td className="py-2 px-2 text-center text-gray-500 align-top">
                                        {item.gstPercent > 0 ? `${item.gstPercent}%` : '-'}
                                    </td>
                                    <td className="py-2 px-2 text-right font-medium text-gray-900 align-top">
                                        {formatINR(item.totalAmount)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals Section - Right Aligned */}
                <div className="p-3 flex justify-end border-t-[2.5px] border-black">
                    <div className="w-48 space-y-0.5">
                        <div className="flex justify-between text-[9px] text-gray-700">
                            <span>Subtotal:</span>
                            <span>{formatINR(invoice.totalTaxable)}</span>
                        </div>
                        <div className="flex justify-between text-[9px] text-gray-700">
                            <span>Total GST:</span>
                            <span>{formatINR(invoice.totalGST)}</span>
                        </div>
                        {/* GRAND TOTAL with Blue Badge */}
                        <div className="flex justify-between font-bold text-white p-1.5 rounded mt-1 text-[10px]"
                            style={{ backgroundColor: settings?.brandColor || '#1e3a8a' }}>
                            <span className="uppercase">GRAND TOTAL:</span>
                            <span>{formatINR(invoice.grandTotal)}</span>
                        </div>
                    </div>
                </div>

                {/* Bottom Section - Footer */}
                <div className="p-3 border-t border-gray-100 print:border-gray-200">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Left: QR Code, Notes, Bank Details */}
                        <div className="space-y-2">
                            {/* QR Code */}
                            {seller.upiId && (
                                <div>
                                    <QRCodeSVG
                                        value={`upi://pay?pa=${seller.upiId}&pn=${encodeURIComponent(seller.storeName || '' || 'Store')}`}
                                        size={60}
                                        level="M"
                                        includeMargin={false}
                                    />
                                    <div className="text-[7px] text-gray-500 mt-0.5">
                                        {settings?.digitalSignature ? 'Scan to Pay' : 'Official Invoice'}
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            <div className="text-[8px] text-gray-600 whitespace-pre-line">
                                {invoice.notes || seller.termsAndConditions || '• Goods once sold will not be taken back\n• Payment due within 30 days'}
                            </div>
                            {seller.invoiceFooterText && (
                                <div
                                    className={`mt-1 ${seller.footerFontFamily === 'handwritten' ? 'font-handwritten' : 'font-medium italic'} ${seller.footerAlignment === 'center' ? 'text-center' : seller.footerAlignment === 'right' ? 'text-right' : 'text-left'} text-gray-500`}
                                    style={{ fontSize: `${seller.footerFontSize * 0.7}px` }}
                                >
                                    {seller.invoiceFooterText}
                                </div>
                            )}

                            {/* Bank Details */}
                            {seller.bankDetails && (
                                <div className="mt-2 whitespace-pre-line">
                                    <div className="font-semibold text-[8px] mb-0.5 text-gray-700">Bank Details:</div>
                                    <div className="text-[7px] text-gray-700 leading-tight">
                                        {seller.bankDetails}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right: Authorized Sign */}
                        <div className="flex flex-col items-end justify-end">
                            {settings?.digitalSignature ? (
                                <img
                                    src={settings.digitalSignature.startsWith('http') ? settings.digitalSignature : `${BACKEND_URL}${settings.digitalSignature}`}
                                    alt="Signature"
                                    className="w-24 h-12 object-contain mb-1"
                                />
                            ) : (
                                <div className="w-20 h-10 flex items-center justify-center border border-dashed border-gray-300 rounded mb-1 bg-gray-50 opacity-50">
                                    <span className="font-serif italic text-[10px] text-gray-400">Signed</span>
                                </div>
                            )}
                            <div className="text-[8px] font-medium text-gray-900">{seller.authSignLabel || 'Authorized Signatory'}</div>
                        </div>
                    </div>
                </div>

                {/* Decorative Footer Bar */}
                <div className="flex h-8 border-t border-white">
                    <div className="w-1/4 h-full" style={{ backgroundColor: settings?.brandColor || '#EF4444' }}></div>
                    <div className="w-1/4 h-full opacity-80" style={{ backgroundColor: settings?.brandColor || '#EF4444' }}></div>
                    <div className="w-1/4 h-full opacity-60" style={{ backgroundColor: settings?.brandColor || '#EF4444' }}></div>
                    <div className="w-1/4 h-full opacity-40" style={{ backgroundColor: settings?.brandColor || '#EF4444' }}></div>
                </div>
            </div>

            {/* Print Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 text-center text-[10px] text-gray-400 dark:text-gray-500 print:block hidden">
                <p>Computer Generated Invoice • {seller.storeName}</p>
            </div>
        </div >
    );

};

export default InvoiceView;
