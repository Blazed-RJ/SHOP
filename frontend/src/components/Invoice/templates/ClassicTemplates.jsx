import React from 'react';
import { formatINR } from '../../../utils/currency';
import { BACKEND_URL } from '../../../utils/api';
import { formatInvoiceDate } from './templateUtils';

// --- CLASSIC V1 (Standard) ---
export const ClassicTemplate = ({ data, settings }) => {
    const {
        logo, shopName, address, phone,
        invoiceFooterText, fieldVisibility = {}
    } = settings;

    const {
        invoiceNo, date, customerName, customerPhone, customerAddress, items = [],
        subtotal, tax, total, digitalSignature, authSignLabel, terms
    } = data;

    return (
        <div className="w-full h-full bg-white font-serif text-xs p-8 text-black flex flex-col">
            <div className="text-center border-b-2 border-black pb-6 mb-6">
                {logo && <img src={logo instanceof File ? URL.createObjectURL(logo) : (logo?.startsWith('http') ? logo : `${BACKEND_URL}${logo}`)} alt="Logo" className="h-16 mx-auto object-contain mb-4" />}
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

// --- CLASSIC V2 (Double Border) ---
export const ClassicTemplateV2 = ({ data, settings }) => {
    const { logo, shopName, address, phone, brandColor = '#000', fieldVisibility = {} } = settings;
    const { invoiceNo, date, customerName, items = [], subtotal, tax, total, terms } = data;

    return (
        <div className="w-full h-full bg-[#fdfbf6] font-serif text-xs p-10 text-gray-900 border-8 border-double border-[#e5e5e5] flex flex-col">
            <div className="text-center mb-10">
                {logo && <img src={logo instanceof File ? URL.createObjectURL(logo) : (logo?.startsWith('http') ? logo : `${BACKEND_URL}${logo}`)} alt="Logo" className="h-16 mx-auto object-contain mb-4 grayscale opacity-80" />}
                <h1 className="text-3xl font-bold uppercase tracking-widest mb-2" style={{ color: brandColor }}>{shopName}</h1>
                <div className="flex justify-center gap-4 text-[10px] italic opacity-60 mb-6">
                    <span>{address}</span>
                    <span>•</span>
                    <span>{phone}</span>
                </div>
                <div className="border-b-2 border-black w-16 mx-auto mb-2"></div>
                <h2 className="text-xl font-bold uppercase tracking-[0.3em] opacity-80">Tax Invoice</h2>
            </div>
            <div className="border border-gray-300 p-6 flex justify-between mb-8 bg-white">
                <div>
                    <span className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">To:</span>
                    <p className="font-bold text-lg">{customerName}</p>
                </div>
                <div className="text-right">
                    <span className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Invoice No:</span>
                    <p className="font-bold text-lg mb-2">{invoiceNo}</p>
                    <span className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Date:</span>
                    <p className="font-bold  text-lg">{formatInvoiceDate(date)}</p>
                </div>
            </div>
            <table className="w-full mb-10">
                <thead>
                    <tr className="border-b border-black">
                        <th className="text-left py-2 font-bold uppercase text-[10px] tracking-wider">Item Particulars</th>
                        <th className="text-center py-2 font-bold uppercase text-[10px] tracking-wider">Qty</th>
                        <th className="text-right py-2 font-bold uppercase text-[10px] tracking-wider">Price</th>
                        <th className="text-right py-2 font-bold uppercase text-[10px] tracking-wider">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, i) => (
                        <tr key={i}>
                            <td className="py-3 pr-4"><span className="font-semibold block">{item.name}</span></td>
                            <td className="py-3 text-center">{item.quantity}</td>
                            <td className="py-3 text-right font-mono">{formatINR(item.price)}</td>
                            <td className="py-3 text-right font-mono font-bold">{formatINR(item.total)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="flex justify-end mb-8">
                <div className="w-1/2 border-t border-black pt-4">
                    <div className="flex justify-between mb-1 text-[10px] font-bold">
                        <span>SUBTOTAL</span>
                        <span>{formatINR(subtotal)}</span>
                    </div>
                    {fieldVisibility.taxBreakdown && (
                        <div className="flex justify-between mb-2 text-[10px] font-bold">
                            <span>TAX</span>
                            <span>{formatINR(tax)}</span>
                        </div>
                    )}
                    <div className="flex justify-between font-bold text-xl border-t-4 border-double border-black pt-2">
                        <span>TOTAL</span>
                        <span>{formatINR(total)}</span>
                    </div>
                </div>
            </div>
            {fieldVisibility.terms && terms && (
                <div className="mt-auto border-t border-gray-300 pt-4 text-[10px] text-gray-500">
                    <p className="font-bold uppercase mb-1">Terms & Conditions:</p>
                    <p className="whitespace-pre-line">{terms}</p>
                </div>
            )}
        </div>
    );
};

// --- CLASSIC V3 (Formal Letter) ---
export const ClassicTemplateV3 = ({ data, settings }) => {
    const { shopName, address, phone } = settings;
    const { invoiceNo, date, customerName, items = [], total } = data;

    return (
        <div className="w-full h-full bg-white font-serif text-xs p-12 text-black flex flex-col no-scrollbar">
            <div className="text-right mb-12 font-bold">
                <h1 className="text-lg">{shopName}</h1>
                <p className="font-normal opacity-60 text-[10px]">{address}</p>
                <p className="font-normal opacity-60 text-[10px]">{phone}</p>
            </div>

            <div className="mb-12">
                <p className="mb-4">{formatInvoiceDate(date)}</p>
                <p className="font-bold uppercase mb-1">INVOICE #{invoiceNo}</p>
                <p className="uppercase">FOR: {customerName}</p>
            </div>

            <table className="w-full mb-8 border-t border-b border-black">
                <thead className="border-b border-black">
                    <tr>
                        <th className="py-2 text-left w-12">NO.</th>
                        <th className="py-2 text-left">DESCRIPTION</th>
                        <th className="py-2 text-right">PRICE</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, i) => (
                        <tr key={i}>
                            <td className="py-2">{i + 1}</td>
                            <td className="py-2">
                                {item.name}
                                <span className="block text-[9px] italic opacity-60">Quantity: {item.quantity}</span>
                            </td>
                            <td className="py-2 text-right">{formatINR(item.total)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-end">
                <div className="text-right">
                    <p className="text-sm font-bold uppercase">Total Due: {formatINR(total)}</p>
                </div>
            </div>

            <div className="mt-auto text-center border-t border-black pt-2">
                <p className="text-[9px] opacity-50">Thank you for your trust.</p>
            </div>
        </div>
    );
};

// --- CLASSIC V4 (Grid) ---
export const ClassicTemplateV4 = ({ data, settings }) => {
    const { shopName, address } = settings;
    const { invoiceNo, date, customerName, items = [], total } = data;

    return (
        <div className="w-full h-full bg-white font-serif text-xs p-8 text-black flex flex-col border border-black m-2 h-[calc(100%-1rem)] w-[calc(100%-1rem)]">
            <div className="grid grid-cols-2 border-b border-black">
                <div className="p-4 border-r border-black">
                    <h1 className="font-bold text-xl">{shopName}</h1>
                    <p className="text-[10px]">{address}</p>
                </div>
                <div className="p-4">
                    <p className="font-bold">INVOICE</p>
                    <p>#{invoiceNo}</p>
                    <p>{formatInvoiceDate(date)}</p>
                </div>
            </div>
            <div className="p-4 border-b border-black">
                <p className="text-[10px] uppercase">Bill To:</p>
                <p className="font-bold">{customerName}</p>
            </div>

            <div className="flex-1">
                <div className="grid grid-cols-12 border-b border-black bg-gray-100 font-bold text-center">
                    <div className="col-span-1 p-2 border-r border-black">#</div>
                    <div className="col-span-7 p-2 border-r border-black text-left">ITEM</div>
                    <div className="col-span-2 p-2 border-r border-black">QTY</div>
                    <div className="col-span-2 p-2">AMT</div>
                </div>
                {items.map((item, i) => (
                    <div key={i} className="grid grid-cols-12 border-b border-black text-center text-[10px]">
                        <div className="col-span-1 p-2 border-r border-black">{i + 1}</div>
                        <div className="col-span-7 p-2 border-r border-black text-left font-bold">{item.name}</div>
                        <div className="col-span-2 p-2 border-r border-black">{item.quantity}</div>
                        <div className="col-span-2 p-2">{formatINR(item.total)}</div>
                    </div>
                ))}
            </div>

            <div className="p-4 flex justify-between items-center bg-gray-100 border-t border-black">
                <p className="font-bold">TOTAL AMOUNT</p>
                <p className="font-bold text-lg">{formatINR(total)}</p>
            </div>
        </div>
    );
};

// --- CLASSIC V5 (Minimal Times) ---
export const ClassicTemplateV5 = ({ data, settings }) => {
    const { shopName } = settings;
    const { invoiceNo, date, items = [], total } = data;

    return (
        <div className="w-full h-full bg-white font-serif text-xs p-16 text-black flex flex-col items-center">
            <h1 className="text-3xl font-bold tracking-widest uppercase mb-12 border-b-2 border-black pb-2">{shopName}</h1>

            <div className="w-full flex justify-between mb-8 italic">
                <p>Ref: {invoiceNo}</p>
                <p>{formatInvoiceDate(date)}</p>
            </div>

            <table className="w-full mb-12">
                <tbody>
                    {items.map((item, i) => (
                        <tr key={i} className="border-b border-dotted border-gray-400">
                            <td className="py-2 text-left">{item.name} <span className="text-[9px] opacity-50">x{item.quantity}</span></td>
                            <td className="py-2 text-right">{formatINR(item.total)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="mt-auto border-t border-black w-full pt-4 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatINR(total)}</span>
            </div>
        </div>
    );
};
