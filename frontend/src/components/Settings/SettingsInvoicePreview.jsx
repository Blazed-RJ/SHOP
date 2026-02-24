import React, { useMemo, useState, useEffect } from 'react';
import { InvoiceRenderer } from '../Invoice/InvoiceTemplates';
import { BACKEND_URL } from '../../utils/api';
import QRCode from 'qrcode';

const SettingsInvoicePreview = ({ settings, formData }) => {
    const [qrCodeUrl, setQrCodeUrl] = useState(null);

    // 1. Merge Settings + FormData (Live Adjustments)
    const previewSettings = useMemo(() => {
        // Resolve Bank Account (Default or First)
        const bankAccounts = formData.bankAccounts || settings?.bankAccounts || [];
        const defaultBank = bankAccounts.find(acc => acc.isDefault) || bankAccounts[0] || {};

        // Use form values if edited, else fallback to default bank, else settings
        const bankName = formData.bankName || defaultBank.bankName || settings?.bankName;
        const accountNumber = formData.accountNumber || defaultBank.accountNumber || settings?.accountNumber;
        const ifscCode = formData.ifscCode || defaultBank.ifscCode || settings?.ifscCode;
        const bankBranch = formData.bankBranch || defaultBank.bankBranch || settings?.bankBranch;
        const bankHolderName = formData.bankHolderName || defaultBank.bankHolderName || settings?.bankHolderName;
        const upiId = formData.upiId || defaultBank.upiId || settings?.upiId;

        // Construct formatted Bank Details string if not explicitly provided
        let formattedBankDetails = settings?.bankDetails;
        if (!formattedBankDetails && (bankName || accountNumber)) {
            const lines = [];
            if (bankName) lines.push(`Bank: ${bankName}`);
            if (accountNumber) lines.push(`A/c No: ${accountNumber}`);
            if (ifscCode) lines.push(`IFSC: ${ifscCode}`);
            if (bankBranch) lines.push(`Branch: ${bankBranch}`);
            if (bankHolderName) lines.push(`Holder: ${bankHolderName}`);
            formattedBankDetails = lines.join('\n');
        }

        return {
            ...settings,
            ...formData,
            // Ensure nested objects merge correctly if needed
            invoiceTemplate: {
                ...settings?.invoiceTemplate,
                ...formData.invoiceTemplate
            },
            // Make sure style props are at top level as expected by templates
            logo: (() => {
                const finalLogo = formData.logo || settings?.logo;
                return finalLogo && typeof finalLogo === 'string' && !finalLogo.startsWith('http') && !finalLogo.startsWith('data:')
                    ? `${BACKEND_URL}${finalLogo}`
                    : finalLogo;
            })(),

            shopName: formData.shopName || settings?.shopName,
            address: formData.address || settings?.address,
            phone: formData.phone || settings?.phone,
            email: formData.email || settings?.email,
            brandColor: formData.brandColor || settings?.brandColor,
            primaryTextColor: formData.primaryTextColor || settings?.primaryTextColor,
            invoiceFooterText: formData.invoiceFooterText || settings?.invoiceFooterText,
            termsAndConditions: formData.termsAndConditions || settings?.termsAndConditions,

            // BANKING
            bankName,
            accountNumber,
            bankHolderName,
            ifscCode,
            bankBranch,
            upiId,
            bankDetails: formattedBankDetails, // Pass the formatted string

            // Signature
            digitalSignature: (settings?.digitalSignature) && typeof settings.digitalSignature === 'string' && !settings.digitalSignature.startsWith('http') && !settings.digitalSignature.startsWith('data:')
                ? `${BACKEND_URL}${settings.digitalSignature}`
                : settings?.digitalSignature,

            // Config
            fieldVisibility: formData.invoiceTemplate?.fieldVisibility || settings?.invoiceTemplate?.fieldVisibility || {}
        };
    }, [settings, formData]);

    // 2. Generate QR Code when UPI ID changes
    useEffect(() => {
        const generateQR = async () => {
            if (previewSettings.upiId) {
                try {
                    const upiUrl = `upi://pay?pa=${previewSettings.upiId}&pn=${previewSettings.shopName || 'Merchant'}&cu=INR`;
                    const url = await QRCode.toDataURL(upiUrl, { width: 150, margin: 1 });
                    setQrCodeUrl(url);
                } catch (err) {
                    console.error("QR Generation failed", err);
                    setQrCodeUrl(null);
                }
            } else {
                setQrCodeUrl(null);
            }
        };
        generateQR();
    }, [previewSettings.upiId, previewSettings.shopName]);

    // 3. Prepare Mock Data (Standard Format)
    const mockData = {
        invoiceNo: 'INV-001',
        date: new Date().toLocaleDateString(),
        customerName: 'John Doe',
        customerPhone: '+91 98765 43210',
        customerAddress: '123, Green Park, New Delhi',
        customerGstin: '07ABCDE1234F1Z5',
        items: [
            { name: 'Wireless Headphones (Sony)', quantity: 2, price: 2500, total: 5000, gstPercent: 18, serialNumber: 'SN8392' },
            { name: 'USB-C Fast Charger', quantity: 5, price: 300, total: 1500, gstPercent: 12 }
        ],
        subtotal: 6500,
        tax: 1170, // Mock tax
        total: 7670,
        totalTaxable: 6500,
        totalGST: 1170,
        terms: previewSettings.termsAndConditions || 'Goods once sold will not be returned.',
        upiId: previewSettings.upiId,
        digitalSignature: previewSettings.digitalSignature,
        authSignLabel: previewSettings.authSignLabel
    };

    // Inject generated QR code into settings passed to renderer
    const rendererSettings = { ...previewSettings, qrCode: qrCodeUrl };

    const templateId = previewSettings.invoiceTemplate?.templateId || 'modern';

    return (
        <div className="w-full h-full bg-white shadow-sm overflow-hidden text-gray-800">
            <InvoiceRenderer
                templateId={templateId}
                data={mockData}
                settings={rendererSettings}
            />
        </div>
    );
};

export default SettingsInvoicePreview;
