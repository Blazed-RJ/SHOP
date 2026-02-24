import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { BACKEND_URL } from '../utils/api';
import { useSettings } from '../context/SettingsContext';
import { Printer, ArrowLeft, Download, Share2, Mail, FileText, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';
import ShareInvoiceModal from '../components/Invoice/ShareInvoiceModal';
import { sharePdf } from '../utils/pdfShare';
import { InvoiceRenderer } from '../components/Invoice/InvoiceTemplates';

const InvoiceView = ({ isPublic = false }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { settings } = useSettings();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const componentRef = React.useRef();

    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        documentTitle: invoice ? `Invoice_${invoice.invoiceNo}` : 'Invoice',
    });

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

        // Using "Download" button -> Force download, High Quality
        if (platform === 'download') {
            await sharePdf('invoice-content', fileName, title, text, { scale: 2, forceDownload: true });
        }
        // Using "Share" button -> Use standard share (mostly mobile), Standard Quality (Speed)
        else {
            await sharePdf('invoice-content', fileName, title, text, { scale: 2, forceDownload: false });
        }
    };

    const handleWhatsAppShare = () => {
        setIsShareModalOpen(true);
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

    // Prepare data for InvoiceRenderer
    const rendererData = {
        invoiceNo: invoice.invoiceNo,
        date: invoice.invoiceDate || invoice.createdAt,
        dueDate: invoice.dueDate,
        customerName: (invoice.customer && invoice.customer.name) ? invoice.customer.name : (invoice.customerName || 'Walk-in Customer'),
        customerPhone: invoice.customerPhone || invoice.customer?.phone,
        customerAddress: invoice.customerAddress || invoice.customer?.address,
        customerGstin: invoice.customerGstin || invoice.customer?.gstin,
        items: invoice.items.map(item => ({
            ...item,
            price: item.pricePerUnit,
            total: item.totalAmount
        })),
        subtotal: invoice.totalTaxable,
        tax: invoice.totalGST,
        total: invoice.grandTotal,
        amountPaid: invoice.amountPaid || 0,
        balanceDue: invoice.balanceDue || 0,
        terms: invoice.notes || seller.termsAndConditions,
        upiId: seller.upiId,
        digitalSignature: settings?.digitalSignature,
        authSignLabel: seller.authSignLabel
    };

    const rendererSettings = {
        ...settings,
        shopName: seller.storeName,
        address: seller.address,
        phone: seller.phone,
        email: seller.email,
        gstin: seller.gstin,
        invoiceFooterText: seller.invoiceFooterText,
        bankDetails: seller.bankDetails,
        brandColor: settings?.brandColor,
        primaryTextColor: settings?.primaryTextColor,
        logo: settings?.logo,
        // Use invoice-specific settings if available, otherwise global defaults
        showWatermark: settings?.invoiceTemplate?.showWatermark ?? true,
        fieldVisibility: settings?.invoiceTemplate?.fieldVisibility || {
            shippingAddress: false,
            taxBreakdown: true,
            signature: true,
            footer: true,
            bankDetails: true,
            qrCode: true,
            terms: true
        }
    };

    const templateId = invoice.templateId || settings?.invoiceTemplate?.templateId || 'modern';

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
                        onClick={() => handleShare('download')}
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
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Printer className="w-4 h-4" />
                        Print Invoice
                    </button>
                </div>
            </div>

            {/* Invoice Paper */}
            <div ref={componentRef} id="invoice-content" className="max-w-4xl mx-auto bg-white shadow-xl rounded-xl overflow-hidden print:shadow-none print:rounded-none print:a4-page-container transition-all duration-300 text-gray-900">
                <InvoiceRenderer
                    templateId={templateId}
                    data={rendererData}
                    settings={rendererSettings}
                />
            </div>

            <ShareInvoiceModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                invoice={invoice}
            />
        </div>
    );
};

export default InvoiceView;
