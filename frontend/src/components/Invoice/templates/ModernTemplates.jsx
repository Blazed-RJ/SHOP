import React from 'react';
import { formatINR } from '../../../utils/currency';
import { QRCodeSVG } from 'qrcode.react';
import { BACKEND_URL } from '../../../utils/api';
import { formatInvoiceDate } from './templateUtils';

// --- MODERN V1 (Standard) ---
export const ModernTemplate = ({ data, settings }) => {
    const {
        logo, shopName, address, phone, email,
        brandColor = '#EF4444', primaryTextColor = '#1F2937',
        invoiceFooterText, fieldVisibility = {}
    } = settings;

    const {
        invoiceNo, date, customerName, customerPhone, customerAddress, customerGstin,
        items = [], subtotal, tax, total, amountInWords, upiId, digitalSignature, authSignLabel, terms
    } = data;

    return (
        <div className="w-full h-full bg-white relative font-sans text-xs flex flex-col" style={{ color: primaryTextColor }}>
            <div className="p-6 md:p-8 pb-4">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        {logo && <img src={logo instanceof File ? URL.createObjectURL(logo) : (logo?.startsWith('http') ? logo : `${BACKEND_URL}${logo}`)} alt="Logo" className="h-14 object-contain mb-3" />}
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

                <div className="flex justify-between items-end border-t-[2.5px] border-black pt-6">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-widest block mb-2" style={{ color: brandColor }}>Bill To</span>
                        <div className="font-bold text-sm">{customerName || 'Walk-in Customer'}</div>
                        {customerPhone && <div className="text-[11px] mt-0.5">{customerPhone}</div>}
                        {customerAddress && <div className="text-[11px] opacity-75 mt-0.5 max-w-[200px]">{customerAddress}</div>}
                        {customerGstin && <div className="text-[10px] font-bold mt-1 opacity-75">GSTIN: {customerGstin}</div>}
                    </div>
                </div>
            </div>

            <div className="px-6 md:px-8">
                <table className="w-full mb-6">
                    <thead>
                        <tr style={{ backgroundColor: `${brandColor}10` }}>
                            <th className="text-left py-3 px-4 text-[10px] font-black uppercase tracking-wider rounded-l-lg" style={{ color: brandColor }}>Item</th>
                            <th className="text-center py-3 px-2 text-[10px] font-black uppercase tracking-wider" style={{ color: brandColor }}>Qty</th>
                            <th className="text-right py-3 px-2 text-[10px] font-black uppercase tracking-wider" style={{ color: brandColor }}>Price</th>
                            <th className="text-right py-3 px-4 text-[10px] font-black uppercase tracking-wider rounded-r-lg" style={{ color: brandColor }}>Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-500/70">
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
                                <td className="text-right py-3 px-4 font-bold text-gray-900">{formatINR(item.total)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

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
                    <div className="flex justify-between items-center pt-3 mt-3 border-t border-dashed border-brand-500/80">
                        <span className="font-black text-sm uppercase tracking-wide" style={{ color: brandColor }}>Grand Total</span>
                        <span className="font-black text-lg" style={{ color: brandColor }}>{formatINR(total)}</span>
                    </div>
                </div>
            </div>

            <div className="flex-1"></div>

            <div className="bg-gray-50 p-6 md:p-8 border-t-[2.5px] border-black">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="flex-1 space-y-4">
                        {fieldVisibility.qrCode && upiId && (
                            <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-brand-500/10 w-fit">
                                <QRCodeSVG value={`upi://pay?pa=${upiId}&pn=${encodeURIComponent(shopName)}&am=${total}`} size={64} level="M" />
                                <div className="text-[9px] font-mono opacity-60">{upiId}</div>
                            </div>
                        )}
                        {fieldVisibility.terms && terms && (
                            <div>
                                <div className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-40">Terms & Conditions</div>
                                <p className="text-[9px] opacity-60 whitespace-pre-line leading-relaxed max-w-xs">{terms}</p>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col items-end text-right">
                        {fieldVisibility.signature && (
                            <div className="mb-6 flex flex-col items-end">
                                {digitalSignature ? (
                                    <img src={digitalSignature.startsWith('http') ? digitalSignature : `${BACKEND_URL}${digitalSignature}`} alt="Signature" className="h-12 object-contain mb-1" />
                                ) : (
                                    <div className="h-16 w-32 border-b border-dashed border-brand-500/30 mb-1"></div>
                                )}
                                <span className="text-[10px] font-bold opacity-60">{authSignLabel || 'Authorized Signatory'}</span>
                            </div>
                        )}
                        {invoiceFooterText && (
                            <p className="italic opacity-50 max-w-xs">{invoiceFooterText}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MODERN V2 (Sidebar) ---
export const ModernTemplateV2 = ({ data, settings }) => {
    const { logo, shopName, address, phone, email, brandColor = '#EF4444', invoiceFooterText, fieldVisibility = {} } = settings;
    const { invoiceNo, date, customerName, customerPhone, customerAddress, customerGstin, items = [], subtotal, tax, total, upiId, digitalSignature, authSignLabel, terms } = data;

    return (
        <div className="w-full h-full bg-white font-sans text-xs flex flex-col relative overflow-hidden">
            <div className="absolute top-0 bottom-0 left-0 w-3" style={{ backgroundColor: brandColor }}></div>
            <div className="p-8 pl-12 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight uppercase mb-1" style={{ color: brandColor }}>INVOICE</h1>
                        <p className="font-bold opacity-50 tracking-widest text-[10px]">#{invoiceNo}</p>
                    </div>
                    <div className="text-right">
                        {logo && <img src={logo instanceof File ? URL.createObjectURL(logo) : (logo?.startsWith('http') ? logo : `${BACKEND_URL}${logo}`)} alt="Logo" className="h-12 object-contain ml-auto mb-2" />}
                        <h2 className="font-bold text-lg">{shopName}</h2>
                        <div className="text-[10px] opacity-70 leading-tight">
                            <p>{address}</p>
                            <p>{phone}</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-12 mb-12">
                    <div className="flex-1">
                        <span className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Billed To</span>
                        <div className="pl-3 border-l-2" style={{ borderColor: `${brandColor}40` }}>
                            <p className="font-bold text-lg">{customerName}</p>
                            <p className="opacity-70">{customerPhone}</p>
                            {customerAddress && <p className="opacity-70 max-w-[200px]">{customerAddress}</p>}
                        </div>
                    </div>
                    <div className="flex-1 text-right">
                        <span className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Details</span>
                        <p><span className="opacity-50 mr-2">Date:</span> {formatInvoiceDate(date)}</p>
                    </div>
                </div>
                <table className="w-full mb-8">
                    <thead>
                        <tr className="border-b-2" style={{ borderColor: brandColor }}>
                            <th className="text-left py-3 font-bold uppercase tracking-wider text-[10px]" style={{ color: brandColor }}>Description</th>
                            <th className="text-center py-3 font-bold uppercase tracking-wider text-[10px] w-16" style={{ color: brandColor }}>Qty</th>
                            <th className="text-right py-3 font-bold uppercase tracking-wider text-[10px] w-24" style={{ color: brandColor }}>Price</th>
                            <th className="text-right py-3 font-bold uppercase tracking-wider text-[10px] w-28" style={{ color: brandColor }}>Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {items.map((item, i) => (
                            <tr key={i}>
                                <td className="py-4"><p className="font-bold text-gray-800">{item.name}</p></td>
                                <td className="py-4 text-center opacity-60">{item.quantity}</td>
                                <td className="py-4 text-right opacity-60">{formatINR(item.price)}</td>
                                <td className="py-4 text-right font-bold text-gray-900">{formatINR(item.total)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="flex justify-end mb-12">
                    <div className="w-64 space-y-3">
                        <div className="flex justify-between items-center pt-4 border-t-[2.5px] border-black">
                            <span className="font-black text-sm uppercase" style={{ color: brandColor }}>Total Due</span>
                            <span className="font-black text-xl" style={{ color: brandColor }}>{formatINR(total)}</span>
                        </div>
                    </div>
                </div>
                <div className="flex justify-between items-end mt-8 border-t-[2.5px] border-black pt-8">
                    <div className="w-1/2">
                        {fieldVisibility.qrCode && upiId && (
                            <QRCodeSVG value={`upi://pay?pa=${upiId}&pn=${encodeURIComponent(shopName)}&am=${total}`} size={56} />
                        )}
                    </div>
                    {fieldVisibility.signature && (
                        <div className="text-right">
                            {digitalSignature && <img src={digitalSignature.startsWith('http') ? digitalSignature : `${BACKEND_URL}${digitalSignature}`} alt="Sign" className="h-10 mx-auto object-contain mb-2" />}
                            <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">{authSignLabel}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- MODERN V3 (Full Banner Header) ---
export const ModernTemplateV3 = ({ data, settings }) => {
    const { logo, shopName, address, phone, email, brandColor = '#10B981', invoiceFooterText, fieldVisibility = {} } = settings;
    const { invoiceNo, date, customerName, customerPhone, items = [], subtotal, total, upiId, digitalSignature, authSignLabel } = data;

    return (
        <div className="w-full h-full bg-white font-sans text-xs flex flex-col">
            <div className="p-8 text-white grid grid-cols-2 gap-8 items-center" style={{ backgroundColor: brandColor }}>
                <div>
                    {logo && <img src={logo instanceof File ? URL.createObjectURL(logo) : (logo?.startsWith('http') ? logo : `${BACKEND_URL}${logo}`)} alt="Logo" className="h-16 object-contain mb-4 bg-white p-2 rounded" />}
                    <h1 className="text-2xl font-bold">{shopName}</h1>
                    <p className="opacity-80 text-[11px] max-w-xs mt-1">{address}</p>
                </div>
                <div className="text-right">
                    <div className="text-5xl font-black opacity-30 uppercase tracking-tighter">Receipt</div>
                    <div className="mt-4 flex flex-col items-end">
                        <div className="bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm text-right inline-block">
                            <span className="block text-[10px] font-bold uppercase opacity-80">Invoice No</span>
                            <span className="font-mono text-lg font-bold">{invoiceNo}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-8 flex-1">
                <div className="grid grid-cols-2 gap-12 mb-10">
                    <div>
                        <div className="uppercase text-[10px] font-bold text-gray-400 tracking-wider mb-2">Billed To</div>
                        <h3 className="text-xl font-bold text-gray-800">{customerName}</h3>
                        <p className="text-gray-500">{customerPhone}</p>
                    </div>
                    <div className="text-right">
                        <div className="uppercase text-[10px] font-bold text-gray-400 tracking-wider mb-2">Date Issued</div>
                        <h3 className="text-xl font-bold text-gray-800">{formatInvoiceDate(date)}</h3>
                    </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-2 mb-8">
                    <table className="w-full">
                        <thead>
                            <tr className="text-[10px] uppercase text-gray-400 border-b-[2.5px] border-black">
                                <th className="py-3 px-4 text-left font-bold tracking-wider">Product</th>
                                <th className="py-3 px-4 text-center font-bold tracking-wider">Qty</th>
                                <th className="py-3 px-4 text-right font-bold tracking-wider">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.map((item, i) => (
                                <tr key={i}>
                                    <td className="py-4 px-4 font-bold text-gray-700">{item.name}</td>
                                    <td className="py-4 px-4 text-center font-medium text-gray-500">{item.quantity}</td>
                                    <td className="py-4 px-4 text-right font-bold text-gray-800">{formatINR(item.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end mb-8">
                    <div className="bg-gray-900 text-white p-6 rounded-xl w-64 shadow-xl shadow-gray-200">
                        <div className="flex justify-between items-center mb-2 opacity-60 text-[11px]">
                            <span>Subtotal</span>
                            <span>{formatINR(subtotal)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t-[2.5px] border-black mt-2">
                            <span className="font-bold">TOTAL</span>
                            <span className="font-bold text-xl text-green-400">{formatINR(total)}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-auto pt-8 border-t-[2.5px] border-black flex justify-between items-center">
                    <div>
                        {upiId && <div className="text-[10px] text-gray-400">Paid via UPI: <span className="font-mono text-gray-600">{upiId}</span></div>}
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-gray-900">{shopName}</p>
                        <p className="text-[10px] text-gray-400">Thank you for shopping</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- MODERN V4 (Geometric/Tech) ---
export const ModernTemplateV4 = ({ data, settings }) => {
    const { shopName, address, phone, brandColor = '#3B82F6', fieldVisibility = {} } = settings;
    const { invoiceNo, date, customerName, items = [], total, upiId } = data;

    return (
        <div className="w-full h-full bg-slate-50 font-sans text-xs flex flex-col p-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-8 border-b-[2.5px] border-black pb-8">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full grid place-items-center text-white text-xl font-black" style={{ backgroundColor: brandColor }}>
                            {shopName?.[0] || 'S'}
                        </div>
                        <div>
                            <h1 className="font-bold text-lg text-slate-900">{shopName}</h1>
                            <p className="text-slate-400 text-[10px]">Invoice #{invoiceNo}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 inline-block mb-1">{formatInvoiceDate(date)}</div>
                    </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 mb-8 flex justify-between items-center border border-slate-100">
                    <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Client</span>
                        <h3 className="font-bold text-slate-800">{customerName}</h3>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Status</span>
                        <div className="flex items-center gap-2 justify-end">
                            <span className="h-2 w-2 rounded-full bg-green-500"></span>
                            <span className="font-bold text-green-600">Paid</span>
                        </div>
                    </div>
                </div>

                <div className="mb-8">
                    {items.map((item, i) => (
                        <div key={i} className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 px-2 rounded-lg transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded bg-slate-100 text-slate-400 grid place-items-center font-bold text-[10px]">{i + 1}</div>
                                <div>
                                    <p className="font-bold text-slate-700">{item.name}</p>
                                    <p className="text-[10px] text-slate-400">{item.quantity} units</p>
                                </div>
                            </div>
                            <div className="font-bold text-slate-700">{formatINR(item.total)}</div>
                        </div>
                    ))}
                </div>

                <div className="mt-auto bg-slate-900 text-white rounded-xl p-6 flex justify-between items-center shadow-lg shadow-slate-200">
                    <div>
                        <p className="text-[10px] opacity-60 uppercase tracking-widest">Total Amount</p>
                        <p className="font-bold text-2xl">{formatINR(total)}</p>
                    </div>
                    {fieldVisibility.qrCode && upiId && (
                        <div className="bg-white p-1 rounded">
                            <QRCodeSVG value={`upi://pay?pa=${upiId}&pn=${encodeURIComponent(shopName)}&am=${total}`} size={40} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- MODERN V5 (Corporate Blue) ---
export const ModernTemplateV5 = ({ data, settings }) => {
    const { logo, shopName, address, phone, brandColor = '#2563EB', address: shopAddress } = settings;
    const { invoiceNo, date, customerName, customerPhone, items = [], total, subtotal, tax } = data;

    return (
        <div className="w-full h-full bg-white font-sans text-xs flex flex-col">
            <div className="h-2 w-full" style={{ backgroundColor: brandColor }}></div>
            <div className="p-10">
                <div className="flex justify-between mb-12">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{shopName}</h1>
                        <p className="text-gray-500 max-w-[200px] leading-relaxed text-[11px]">{shopAddress}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-5xl font-bold text-gray-100 -mt-2 absolute right-8">INVOICE</h2>
                        <div className="relative z-10 mt-8">
                            <p className="text-gray-500 text-[10px] uppercase tracking-wider">Invoice Number</p>
                            <p className="text-xl font-bold text-gray-800 mb-4">#{invoiceNo}</p>
                            <p className="text-gray-500 text-[10px] uppercase tracking-wider">Date</p>
                            <p className="font-bold text-gray-800">{formatInvoiceDate(date)}</p>
                        </div>
                    </div>
                </div>

                <div className="mb-12 border-l-4 pl-6 py-1" style={{ borderColor: brandColor }}>
                    <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-2">Invoiced To</p>
                    <h3 className="text-xl font-bold text-gray-900">{customerName}</h3>
                    <p className="text-gray-500">{customerPhone}</p>
                </div>

                <table className="w-full mb-10">
                    <thead className="border-b-[2.5px] border-black">
                        <tr>
                            <th className="text-left font-bold text-gray-900 uppercase text-[10px] py-3 tracking-wider">Item Description</th>
                            <th className="text-center font-bold text-gray-900 uppercase text-[10px] py-3 tracking-wider w-20">Qty</th>
                            <th className="text-right font-bold text-gray-900 uppercase text-[10px] py-3 tracking-wider w-32">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {items.map((item, i) => (
                            <tr key={i}>
                                <td className="py-4 font-bold text-gray-700">{item.name}</td>
                                <td className="py-4 text-center text-gray-500">{item.quantity}</td>
                                <td className="py-4 text-right font-bold text-gray-900">{formatINR(item.total)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="flex justify-end">
                    <div className="w-1/2 border-t py-4 border-gray-100">
                        <div className="flex justify-between mb-2 text-[11px]">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="font-medium">{formatINR(subtotal)}</span>
                        </div>
                        <div className="flex justify-between mb-4 text-[11px]">
                            <span className="text-gray-500">Tax</span>
                            <span className="font-medium">{formatINR(tax)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-white p-4 rounded" style={{ backgroundColor: brandColor }}>
                            <span>Total</span>
                            <span>{formatINR(total)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
