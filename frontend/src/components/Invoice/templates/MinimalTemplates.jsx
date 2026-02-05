import React from 'react';
import { formatINR } from '../../../utils/currency';
import { QRCodeSVG } from 'qrcode.react';
import { formatInvoiceDate } from './templateUtils';

// --- MINIMAL V1 (Receipt) ---
export const MinimalTemplate = ({ data, settings }) => {
    const { shopName, invoiceFooterText, fieldVisibility = {} } = settings;
    const { invoiceNo, date, customerName, items = [], total, upiId, terms } = data;

    return (
        <div className="w-full h-full bg-white font-mono text-xs p-6 text-gray-800 flex flex-col">
            <h1 className="text-xl font-bold mb-6">{shopName}</h1>

            <div className="mb-8 border-l-2 border-brand-500/30 pl-4">
                <p>INV: {invoiceNo}</p>
                <p>DAT: {formatInvoiceDate(date)}</p>
                <p>CUS: {customerName}</p>
            </div>

            <div className="mb-8">
                <div className="border-b border-brand-500/30 pb-2 mb-2 flex justify-between font-bold">
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

            <div className="border-t-2 border-brand-500/30 pt-2 flex justify-between font-bold text-lg mb-8">
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

// --- MINIMAL V2 (Clean/Big Type) ---
export const MinimalTemplateV2 = ({ data, settings }) => {
    const { shopName, address, phone, invoiceFooterText, fieldVisibility = {} } = settings;
    const { invoiceNo, date, customerName, items = [], total } = data;

    return (
        <div className="w-full h-full bg-white font-mono text-[11px] p-8 text-black flex flex-col">
            <div className="flex justify-between mb-12 items-start">
                <div>
                    <h1 className="font-bold text-2xl tracking-tighter mb-2">{shopName}</h1>
                    <p className="opacity-50">{address}</p>
                    <p className="opacity-50">{phone}</p>
                </div>
                <div className="text-right">
                    <div className="inline-block bg-black text-white px-2 py-1 text-lg font-bold mb-1">#{invoiceNo}</div>
                    <p>{formatInvoiceDate(date)}</p>
                </div>
            </div>

            <div className="mb-8">
                <p className="opacity-40 uppercase text-[9px] tracking-widest mb-2">Client</p>
                <p className="text-lg font-bold border-b border-black inline-block pb-1 pr-12">{customerName}</p>
            </div>

            <div className="mb-12">
                <div className="grid grid-cols-12 opacity-40 mb-4 pb-2 border-b border-brand-500/20">
                    <div className="col-span-8">ITEM</div>
                    <div className="col-span-1 text-center">QTY</div>
                    <div className="col-span-3 text-right">TOTAL</div>
                </div>
                {items.map((item, i) => (
                    <div key={i} className="grid grid-cols-12 py-2 items-baseline">
                        <div className="col-span-8 font-bold">{item.name}</div>
                        <div className="col-span-1 text-center opacity-50">{item.quantity}</div>
                        <div className="col-span-3 text-right font-bold">{formatINR(item.total)}</div>
                    </div>
                ))}
            </div>

            <div className="flex justify-end mb-12">
                <div className="text-right">
                    <p className="opacity-40 uppercase text-[9px] tracking-widest mb-1">Total Amount</p>
                    <p className="text-4xl font-black">{formatINR(total)}</p>
                </div>
            </div>

            <div className="mt-auto border-t border-black pt-4 flex justify-between opacity-50 text-[9px] uppercase tracking-widest">
                <span>{invoiceFooterText}</span>
                <span>ORIGINAL RECEIPT</span>
            </div>
        </div>
    );
};

// --- MINIMAL V3 (Right Aligned) ---
export const MinimalTemplateV3 = ({ data, settings }) => {
    const { shopName } = settings;
    const { invoiceNo, date, items = [], total } = data;

    return (
        <div className="w-full h-full bg-white font-sans text-xs p-10 flex flex-col text-right">
            <h1 className="text-3xl font-light mb-1">{shopName}</h1>
            <p className="mb-12 text-gray-400">#{invoiceNo} &mdash; {formatInvoiceDate(date)}</p>

            <div className="mb-12">
                {items.map((item, i) => (
                    <div key={i} className="mb-4 pb-4 border-b border-brand-500/10">
                        <p className="font-bold text-lg">{item.name}</p>
                        <p className="text-gray-400">{item.quantity} x {formatINR(item.price)}</p>
                        <p className="font-mono mt-1">{formatINR(item.total)}</p>
                    </div>
                ))}
            </div>

            <div className="mt-auto">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Total Payable</p>
                <p className="text-5xl font-thin">{formatINR(total)}</p>
            </div>
        </div>
    );
}

// --- MINIMAL V4 (Divider) ---
export const MinimalTemplateV4 = ({ data, settings }) => {
    const { shopName } = settings;
    const { invoiceNo, items = [], total } = data;

    return (
        <div className="w-full h-full bg-white font-mono text-[10px] p-6 flex flex-col items-center text-center">
            <div className="h-2 w-2 bg-black rounded-full mb-8"></div>
            <h1 className="uppercase tracking-[0.5em] mb-8">{shopName}</h1>

            <div className="w-full border-t border-b border-black py-4 mb-4">
                <div className="flex justify-between">
                    <span>NO. {invoiceNo}</span>
                    <span>TOTAL: {formatINR(total)}</span>
                </div>
            </div>

            <div className="w-full space-y-2">
                {items.map((item, i) => (
                    <div key={i} className="flex justify-between text-gray-600">
                        <span>{item.name} (x{item.quantity})</span>
                        <span>{formatINR(item.total)}</span>
                    </div>
                ))}
            </div>

            <div className="mt-8 pt-8 border-t border-dotted border-gray-400 w-full">
                <QRCodeSVG value={`Invoice:${invoiceNo}`} size={32} className="mx-auto opacity-50" />
            </div>
        </div>
    );
}

// --- MINIMAL V5 (Swiss) ---
export const MinimalTemplateV5 = ({ data, settings }) => {
    const { shopName } = settings;
    const { invoiceNo, date, items = [], total } = data;

    return (
        <div className="w-full h-full bg-[#f0f0f0] font-sans text-xs p-8 flex flex-col">
            <div className="bg-white flex-1 p-8 shadow-sm">
                <div className="flex justify-between mb-20">
                    <h1 className="font-bold text-xl">{shopName}</h1>
                    <div className="text-right">
                        <p className="font-bold">{invoiceNo}</p>
                        <p className="text-gray-400">{formatInvoiceDate(date)}</p>
                    </div>
                </div>

                <div className="mb-20">
                    {items.map((item, i) => (
                        <div key={i} className="grid grid-cols-4 mb-4 align-top">
                            <div className="col-span-3">
                                <p className="font-bold">{item.name}</p>
                            </div>
                            <div className="col-span-1 text-right font-mono">
                                {formatINR(item.total)}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="border-t-4 border-black pt-4">
                    <div className="grid grid-cols-4">
                        <div className="col-span-3 font-bold">Total (INR)</div>
                        <div className="col-span-1 text-right font-mono font-bold">{formatINR(total)}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
