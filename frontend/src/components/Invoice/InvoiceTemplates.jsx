import React from 'react';
import { formatINR } from '../../utils/currency';
import { QRCodeSVG } from 'qrcode.react';
import { BACKEND_URL } from '../../utils/api';

// Helper to safely access data
const safelyGet = (obj, path, fallback = '') => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj) || fallback;
};

// Helper to format date as "DD MMMM YYYY"
const formatInvoiceDate = (dateString) => {
    if (!dateString) return '';
    try {
        const [year, month, day] = dateString.split('-');
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch (e) {
        return dateString;
    }
};

// --- MODERN TEMPLATE ---
export const ModernTemplate = ({ data, settings }) => {
    const {
        logo,
        shopName,
        address,
        phone,
        email,
        brandColor = '#EF4444',
        primaryTextColor = '#1F2937',
        invoiceFooterText,
        fieldVisibility = {}
    } = settings;

    const {
        invoiceNo,
        date,
        customerName,
        customerPhone,
        customerAddress,
        customerGstin,
        items = [],
        subtotal,
        tax,
        total,
        amountInWords,
        upiId,
        digitalSignature,
        authSignLabel,
        terms
    } = data;

    return (
        <div className="w-full h-full bg-white relative font-sans text-xs flex flex-col" style={{ color: primaryTextColor }}>
            {/* Header */}
            <div className="p-6 md:p-8 pb-4">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        {logo && <img src={logo instanceof File ? URL.createObjectURL(logo) : (logo?.startsWith('http') ? logo : `${BACKEND_URL}${logo} `)} alt="Logo" className="h-14 object-contain mb-3" />}
                        <h1 className="text-xl font-bold uppercase tracking-tight" style={{ color: brandColor }}>{shopName || 'Store Name'}</h1>
                        <p className="opacity-75 whitespace-pre-line text-[11px] leading-relaxed mt-1">{address}</p>
                        <div className="mt-2 text-[11px] opacity-75 font-medium">
                            {phone && <span>{phone}</span>}
                            {phone && email && <span className="mx-2">•</span>}
                            {email && <span>{email}</span>}
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-3xl font-black opacity-10 uppercase tracking-widest mb-2">Invoice</h2>
                        <div className="space-y-1">
                            <div>
                                <span className="block text-[10px] font-bold uppercase opacity-50 tracking-wider">Invoice No</span>
                                <span className="font-bold text-sm">{invoiceNo}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold uppercase opacity-50 tracking-wider">Date</span>
                                <span className="font-bold text-sm">{formatInvoiceDate(date)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bill To */}
                <div className="flex justify-between items-end border-t border-gray-100 pt-6">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-widest block mb-2" style={{ color: brandColor }}>Bill To</span>
                        <div className="font-bold text-sm">{customerName || 'Walk-in Customer'}</div>
                        {customerPhone && <div className="text-[11px] mt-0.5">{customerPhone}</div>}
                        {customerAddress && <div className="text-[11px] opacity-75 mt-0.5 max-w-[200px]">{customerAddress}</div>}
                        {customerGstin && <div className="text-[10px] font-bold mt-1 opacity-75">GSTIN: {customerGstin}</div>}
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="px-6 md:px-8">
                <table className="w-full mb-6">
                    <thead>
                        <tr style={{ backgroundColor: `${brandColor} 10` }}>
                            <th className="text-left py-3 px-4 text-[10px] font-black uppercase tracking-wider rounded-l-lg" style={{ color: brandColor }}>Item</th>
                            <th className="text-center py-3 px-2 text-[10px] font-black uppercase tracking-wider" style={{ color: brandColor }}>Qty</th>
                            <th className="text-right py-3 px-2 text-[10px] font-black uppercase tracking-wider" style={{ color: brandColor }}>Price</th>
                            {fieldVisibility.taxBreakdown && <th className="text-center py-3 px-2 text-[10px] font-black uppercase tracking-wider" style={{ color: brandColor }}>GST</th>}
                            <th className="text-right py-3 px-4 text-[10px] font-black uppercase tracking-wider rounded-r-lg" style={{ color: brandColor }}>Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {items.map((item, i) => (
                            <tr key={i}>
                                <td className="py-3 px-4">
                                    <div className="font-semibold text-gray-800">{item.name}</div>
                                    <div className="text-[9px] opacity-60 space-x-2">
                                        {item.serialNumber && <span>SN: {item.serialNumber}</span>}
                                        {item.imei && <span>IMEI: {item.imei}</span>}
                                    </div>
                                </td>
                                <td className="text-center py-3 px-2 font-medium opacity-75">{item.quantity}</td>
                                <td className="text-right py-3 px-2 opacity-75">{formatINR(item.price)}</td>
                                {fieldVisibility.taxBreakdown && (
                                    <td className="text-center py-3 px-2 opacity-60">
                                        {item.gstPercent > 0 ? `${item.gstPercent}% ` : '-'}
                                    </td>
                                )}
                                <td className="text-right py-3 px-4 font-bold text-gray-900">{formatINR(item.total)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals */}
            <div className="px-6 md:px-8 mb-8 flex justify-end">
                <div className="w-1/2 md:w-1/3 min-w-[200px] space-y-2">
                    <div className="flex justify-between text-[11px]">
                        <span className="opacity-60 font-medium">Subtotal</span>
                        <span className="font-bold opacity-80">{formatINR(subtotal)}</span>
                    </div>
                    {fieldVisibility.taxBreakdown && (
                        <div className="flex justify-between text-[11px]">
                            <span className="opacity-60 font-medium">Total GST</span>
                            <span className="font-bold opacity-80">{formatINR(tax)}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center pt-3 mt-3 border-t border-dashed border-gray-200">
                        <span className="font-black text-sm uppercase tracking-wide" style={{ color: brandColor }}>Grand Total</span>
                        <span className="font-black text-lg" style={{ color: brandColor }}>{formatINR(total)}</span>
                    </div>
                </div>
            </div>

            <div className="flex-1"></div>

            {/* Footer */}
            <div className="bg-gray-50 p-6 md:p-8 border-t border-gray-100">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                    {/* Left: QR & Terms */}
                    <div className="flex-1 space-y-4">
                        {fieldVisibility.qrCode && upiId && (
                            <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-100 w-fit">
                                <QRCodeSVG value={`upi://pay?pa=${upiId}&pn=${encodeURIComponent(shopName)}&am=${total}`} size={64} level="M" />
                                {
                                    fieldVisibility.qrText && (
                                        <div>
                                            <div className="text-[10px] font-bold" style={{ color: primaryTextColor }}>Scan to Pay</div>
                                            <div className="text-[9px] font-mono opacity-60">{upiId}</div>
                                        </div>
                                    )
                                }
                            </div >
                        )}

                        {
                            (fieldVisibility.terms && terms) && (
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-40">Terms & Conditions</div>
                                    <p className="text-[9px] opacity-60 whitespace-pre-line leading-relaxed max-w-xs">{terms}</p>
                                </div>
                            )
                        }

                        {
                            fieldVisibility.bankDetails && settings.bankDetails && (
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-40">Bank Details</div>
                                    <p className="text-[9px] opacity-60 whitespace-pre-line leading-relaxed">{settings.bankDetails}</p>
                                </div>
                            )
                        }
                    </div >

                    {/* Right: Signature & Note */}
                    < div className="flex flex-col items-end text-right" >
                        {
                            fieldVisibility.signature && (
                                <div className="mb-6 flex flex-col items-end">
                                    {digitalSignature ? (
                                        <img src={digitalSignature.startsWith('http') ? digitalSignature : `${BACKEND_URL}${digitalSignature}`} alt="Signature" className="h-12 object-contain mb-1" />
                                    ) : (
                                        <div className="h-16 w-32 border-b border-dashed border-gray-300 mb-1"></div>
                                    )}
                                    <span className="text-[10px] font-bold opacity-60">{authSignLabel || 'Authorized Signatory'}</span>
                                </div>
                            )
                        }

                        {
                            fieldVisibility.footer && invoiceFooterText && (
                                <p
                                    className="italic opacity-50 max-w-xs"
                                    style={{ fontSize: `${settings.footerFontSize || 12}px` }}
                                >
                                    {invoiceFooterText}
                                </p>
                            )
                        }
                    </div >
                </div >
            </div >
        </div >
    );
};


// --- CLASSIC TEMPLATE ---
export const ClassicTemplate = ({ data, settings }) => {
    const {
        logo, shopName, address, phone,
        brandColor = '#000', primaryTextColor = '#000',
        invoiceFooterText, fieldVisibility = {}
    } = settings;

    // ... extract data props similar to Modern
    const {
        invoiceNo, date, customerName, customerPhone, customerAddress, items = [],
        subtotal, tax, total, upiId, digitalSignature, authSignLabel, terms
    } = data;

    return (
        <div className="w-full h-full bg-white font-serif text-xs p-8 text-black flex flex-col">
            {/* Header Centered */}
            <div className="text-center border-b-2 border-black pb-6 mb-6">
                <h1 className="text-2xl font-bold uppercase tracking-widest mb-2">{shopName}</h1>
                <p className="italic opacity-80">{address}</p>
                <p className="mt-1 opacity-80">{phone}</p>
            </div>

            <div className="flex justify-between mb-8">
                <div>
                    <span className="font-bold underline block mb-1">BILLED TO:</span>
                    <p className="font-bold text-sm">{customerName}</p>
                    <p>{customerPhone}</p>
                    {customerAddress && <p className="w-48 text-[11px] mt-1">{customerAddress}</p>}
                </div>
                <div className="text-right">
                    <span className="font-bold underline block mb-1">INVOICE DETAILS:</span>
                    <p><span className="font-semibold">NO:</span> {invoiceNo}</p>
                    <p><span className="font-semibold">DATE:</span> {formatInvoiceDate(date)}</p>
                </div>
            </div>

            <table className="w-full mb-8 border-collapse border border-black">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border border-black p-2 text-left">DESCRIPTION</th>
                        <th className="border border-black p-2 text-center w-16">QTY</th>
                        <th className="border border-black p-2 text-right w-24">RATE</th>
                        <th className="border border-black p-2 text-right w-28">AMOUNT</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, i) => (
                        <tr key={i}>
                            <td className="border border-black p-2">
                                {item.name}
                                {(item.imei || item.serialNumber) && (
                                    <div className="text-[10px] italic mt-0.5">
                                        {item.imei && `IMEI: ${item.imei} `}
                                        {item.serialNumber && `SN: ${item.serialNumber}`}
                                    </div>
                                )}
                            </td>
                            <td className="border border-black p-2 text-center">{item.quantity}</td>
                            <td className="border border-black p-2 text-right">{formatINR(item.price)}</td>
                            <td className="border border-black p-2 text-right">{formatINR(item.total)}</td>
                        </tr>
                    ))}
                    {/* Fill empty rows if needed for A4 feel? Nah */}
                </tbody>
            </table>

            <div className="flex justify-end mb-12">
                <div className="w-1/2 border border-black p-4">
                    <div className="flex justify-between mb-1">
                        <span>SUBTOTAL</span>
                        <span>{formatINR(subtotal)}</span>
                    </div>
                    {fieldVisibility.taxBreakdown && (
                        <div className="flex justify-between mb-2">
                            <span>GST</span>
                            <span>{formatINR(tax)}</span>
                        </div>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t border-black pt-2">
                        <span>TOTAL</span>
                        <span>{formatINR(total)}</span>
                    </div>
                </div>
            </div>

            <div className="mt-auto flex justify-between items-end">
                <div className="w-2/3 text-[10px]">
                    {fieldVisibility.terms && (
                        <>
                            <span className="font-bold underline">TERMS:</span>
                            <p className="mt-1 whitespace-pre-line">{terms}</p>
                        </>
                    )}
                </div>
                {fieldVisibility.signature && (
                    <div className="text-center">
                        {digitalSignature && <img src={digitalSignature.startsWith('http') ? digitalSignature : `${BACKEND_URL}${digitalSignature}`} className="h-10 mx-auto object-contain" alt="Sign" />}
                        <div className="border-t border-black w-32 mt-8 pt-1 font-bold text-[10px]">{authSignLabel}</div>
                    </div>
                )}
            </div>
            {fieldVisibility.footer && (
                <div
                    className="text-center mt-8 pt-4 border-t border-black italic"
                    style={{ fontSize: `${settings.footerFontSize || 12}px` }}
                >
                    {invoiceFooterText}
                </div>
            )}
        </div>
    );
};

// --- MINIMAL TEMPLATE ---
export const MinimalTemplate = ({ data, settings }) => {
    const { shopName, invoiceFooterText, fieldVisibility = {} } = settings;
    const { invoiceNo, date, customerName, items = [], total, upiId, terms } = data;

    return (
        <div className="w-full h-full bg-white font-mono text-xs p-6 text-gray-800 flex flex-col">
            <h1 className="text-xl font-bold mb-6">{shopName}</h1>

            <div className="mb-8 border-l-2 border-gray-800 pl-4">
                <p>INV: {invoiceNo}</p>
                <p>DAT: {formatInvoiceDate(date)}</p>
                <p>CUS: {customerName}</p>
            </div>

            <div className="mb-8">
                <div className="border-b border-gray-800 pb-2 mb-2 flex justify-between font-bold">
                    <span>ITEM</span>
                    <span>AMT</span>
                </div>
                {items.map((item, i) => (
                    <div key={i} className="flex justify-between py-1">
                        <span className="truncate w-2/3">
                            {item.quantity} x {item.name}
                        </span>
                        <span>{formatINR(item.total)}</span>
                    </div>
                ))}
            </div>

            <div className="border-t-2 border-gray-800 pt-2 flex justify-between font-bold text-lg mb-8">
                <span>TOTAL</span>
                <span>{formatINR(total)}</span>
            </div>

            <div className="mt-auto text-[10px] opacity-75">
                {fieldVisibility.qrCode && upiId && (
                    <div className="mb-4">
                        <p>PAY VIA UPI: {upiId}</p>
                    </div>
                )}
                <p style={{ fontSize: `${settings.footerFontSize || 10}px` }}>{invoiceFooterText}</p>
            </div>
        </div>
    );
};

// --- CUSTOM TEMPLATE ---
export const CustomTemplate = ({ data, settings }) => {
    // Basic interpolation engine
    const processTemplate = (template, data, settings) => {
        if (!template) return '<div class="p-4 text-red-500">No custom template content found.</div>';

        let html = template;

        // 1. Simple replacements (Settings)
        const replacements = {
            // Settings
            '{{shopName}}': settings.shopName || '',
            '{{address}}': settings.address || '',
            '{{phone}}': settings.phone || '',
            '{{email}}': settings.email || '',
            '{{brandColor}}': settings.brandColor || '#000',

            // Data
            '{{invoiceNo}}': data.invoiceNo || '',
            '{{date}}': data.date || '',
            '{{customerName}}': data.customerName || '',
            '{{customerPhone}}': data.customerPhone || '',
            '{{total}}': formatINR(data.total),
            '{{subtotal}}': formatINR(data.subtotal),
            '{{tax}}': formatINR(data.tax),
        };

        Object.keys(replacements).forEach(key => {
            html = html.replace(new RegExp(key, 'g'), replacements[key]);
        });

        // 2. Items Table Rows
        const itemsRows = data.items.map((item, i) => `
            <tr>
                <td style="padding: 5px; border-bottom: 1px solid #eee;">${item.name}</td>
                <td style="padding: 5px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
                <td style="padding: 5px; border-bottom: 1px solid #eee; text-align: right;">${formatINR(item.price)}</td>
                <td style="padding: 5px; border-bottom: 1px solid #eee; text-align: right;">${formatINR(item.total)}</td>
            </tr>
        `).join('');

        html = html.replace('{{itemsRows}}', itemsRows);

        return html;
    };

    const customContent = settings.customTemplateContent || settings.invoiceTemplate?.customTemplateContent || '';
    const htmlContent = processTemplate(customContent, data, settings);

    return (
        <div
            className="w-full h-full bg-white overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
    );
};

export const InvoiceRenderer = ({ templateId, data, settings }) => {
    switch (templateId) {
        case 'classic': return <ClassicTemplate data={data} settings={settings} />;
        case 'minimal': return <MinimalTemplate data={data} settings={settings} />;
        case 'custom': return <CustomTemplate data={data} settings={settings} />;
        case 'modern':
        default: return <ModernTemplate data={data} settings={settings} />;
    }
};
