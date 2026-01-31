import React, { useMemo } from 'react';
import { InvoiceRenderer } from '../Invoice/InvoiceTemplates';

const SettingsInvoicePreview = ({ settings, formData }) => {
    // 1. Merge Settings + FormData (Live Adjustments)
    const previewSettings = useMemo(() => ({
        ...settings,
        ...formData,
        // Ensure nested objects merge correctly if needed
        invoiceTemplate: {
            ...settings?.invoiceTemplate,
            ...formData.invoiceTemplate
        },
        // Make sure style props are at top level as expected by templates
        logo: formData.logo || settings?.logo,
        shopName: formData.shopName || settings?.shopName,
        address: formData.address || settings?.address,
        phone: formData.phone || settings?.phone,
        email: formData.email || settings?.email,
        brandColor: formData.brandColor || settings?.brandColor,
        primaryTextColor: formData.primaryTextColor || settings?.primaryTextColor,
        invoiceFooterText: formData.invoiceFooterText || settings?.invoiceFooterText,
        termsAndConditions: formData.termsAndConditions || settings?.termsAndConditions,
        bankDetails: formData.bankDetails || `${settings?.bankName || ''}\n${settings?.accountNumber || ''}`,
        upiId: formData.upiId || settings?.upiId,
        digitalSignature: settings?.digitalSignature, // Signature not usually in formData unless updated there

        // Config
        fieldVisibility: formData.invoiceTemplate?.fieldVisibility || settings?.invoiceTemplate?.fieldVisibility || {}
    }), [settings, formData]);

    // 2. Prepare Mock Data (Standard Format)
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

    const templateId = previewSettings.invoiceTemplate?.templateId || 'modern';

    return (
        <div className="w-full h-full bg-white shadow-sm overflow-hidden text-gray-800">
            <InvoiceRenderer
                templateId={templateId}
                data={mockData}
                settings={previewSettings}
            />
        </div>
    );
};

export default SettingsInvoicePreview;
