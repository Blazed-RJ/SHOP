import React from 'react';
import { formatINR } from '../../../utils/currency';



export const CarbonTemplate = ({ data, settings }) => {
    const {
        invoiceNo = '', date = '', customerName = '', customerPhone = '',
        customerAddress = '', customerGstin = '', items = [],
        subtotal = 0, tax = 0, total = 0, terms = '',
        authSignLabel = 'Authorised Sign',
    } = data || {};

    const {
        shopName = '', address = '', phone = '', email = '',
        gstin = '', bankDetails = '', invoiceFooterText = '',
        fieldVisibility = {}, brandColor, primaryTextColor
    } = settings || {};

    // Carbon is dark mode, so brandColor usually is the accent/text
    const highlight = brandColor || '#e4e4e7';
    const accent = primaryTextColor || '#a1a1aa';

    const carbon = '#18181b';
    const steel = '#27272a';

    const formatDate = (d) => {
        if (!d) return '';
        try { const dt = new Date(d); if (isNaN(dt)) return d; return `${String(dt.getDate()).padStart(2, '0')}.${String(dt.getMonth() + 1).padStart(2, '0')}.${dt.getFullYear()}`; } catch { return d; }
    };

    const bankLines = bankDetails ? bankDetails.split('\n').filter(Boolean) : null;

    return (
        <div style={{ fontFamily: "'Segoe UI', sans-serif", width: '100%', height: '100%', background: carbon, position: 'relative', color: '#d4d4d8', fontSize: '12px', boxSizing: 'border-box' }}>
            {/* Top accent */}
            <div style={{ height: '2px', background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />

            {/* Header */}
            <div style={{ padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${steel}` }}>
                <div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: highlight, letterSpacing: '2px', textTransform: 'uppercase' }}>{shopName || 'Your Business'}</div>
                    {address && <div style={{ fontSize: '10px', color: accent, marginTop: '4px' }}>{address}</div>}
                    <div style={{ fontSize: '10px', color: accent }}>{phone}{phone && email && ' | '}{email}</div>
                    {gstin && <div style={{ fontSize: '10px', color: '#71717a', marginTop: '2px' }}>GSTIN: {gstin}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '30px', fontWeight: 200, letterSpacing: '8px', color: '#52525b' }}>INVOICE</div>
                    <div style={{ fontSize: '10px', color: accent, marginTop: '6px' }}>#{invoiceNo}</div>
                    <div style={{ fontSize: '10px', color: '#71717a' }}>{formatDate(date)}</div>
                </div>
            </div>

            {/* Bill To */}
            <div style={{ padding: '20px 32px', background: steel, margin: '16px 32px', borderRadius: '4px', border: `1px solid #3f3f46` }}>
                <div style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '3px', color: '#71717a', fontWeight: 700, marginBottom: '8px' }}>BILL TO</div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: highlight }}>{customerName}</div>
                {customerAddress && <div style={{ fontSize: '10px', color: accent, marginTop: '3px' }}>{customerAddress}</div>}
                {customerPhone && <div style={{ fontSize: '10px', color: accent }}>{customerPhone}</div>}
                {customerGstin && <div style={{ fontSize: '10px', color: '#71717a' }}>GSTIN: {customerGstin}</div>}
            </div>

            {/* Table */}
            <div style={{ padding: '0 32px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                        <tr style={{ borderBottom: `1px solid #3f3f46` }}>
                            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#71717a', width: '6%', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>#</th>
                            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#71717a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Item</th>
                            <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#71717a', width: '14%', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Rate</th>
                            <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#71717a', width: '10%', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Qty</th>
                            <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#71717a', width: '18%', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, i) => (
                            <tr key={i} style={{ background: i % 2 === 0 ? steel : 'transparent' }}>
                                <td style={{ padding: '10px 12px', borderBottom: `1px solid #27272a`, color: '#52525b' }}>{i + 1}</td>
                                <td style={{ padding: '10px 12px', borderBottom: `1px solid #27272a`, fontWeight: 600, color: highlight }}>{item.name}</td>
                                <td style={{ padding: '10px 12px', borderBottom: `1px solid #27272a`, textAlign: 'center', color: accent }}>{formatINR(item.price)}</td>
                                <td style={{ padding: '10px 12px', borderBottom: `1px solid #27272a`, textAlign: 'center', color: accent }}>{item.quantity}</td>
                                <td style={{ padding: '10px 12px', borderBottom: `1px solid #27272a`, textAlign: 'right', fontWeight: 600, color: highlight }}>{formatINR(item.total)}</td>
                            </tr>
                        ))}
                        {items.length === 0 && <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#52525b', fontStyle: 'italic' }}>No items</td></tr>}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '24px 32px', marginTop: '8px' }}>
                <div style={{ width: '55%' }}>
                    {fieldVisibility.footer !== false && (
                        <div style={{ fontWeight: 600, fontSize: '11px', color: accent, marginBottom: '16px' }}>
                            {invoiceFooterText || 'Thank you for your business.'}
                        </div>
                    )}

                    {fieldVisibility.bankDetails !== false && bankLines && (
                        <div style={{ marginBottom: '16px', fontSize: '10px' }}>
                            <div style={{ fontWeight: 700, color: '#71717a', marginBottom: '6px', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '2px' }}>Payment</div>
                            {bankLines.map((l, i) => <div key={i} style={{ color: accent, lineHeight: 1.8 }}>{l}</div>)}
                        </div>
                    )}

                    {/* UPI QR Code */}
                    {fieldVisibility.qrCode !== false && settings.qrCode && (
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontWeight: 700, color: '#71717a', marginBottom: '6px', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '2px' }}>
                                {fieldVisibility.qrText !== false ? 'Scan to Pay' : ''}
                            </div>
                            <img src={settings.qrCode} alt="UPI QR" style={{ width: '80px', height: '80px', filter: 'invert(1) grayscale(100%)' }} />
                        </div>
                    )}

                    {fieldVisibility.terms !== false && terms && (
                        <div style={{ fontSize: '10px' }}>
                            <div style={{ fontWeight: 700, color: '#71717a', marginBottom: '6px', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '2px' }}>Terms</div>
                            <div style={{ color: '#71717a', lineHeight: 1.5 }}>{terms}</div>
                        </div>
                    )}
                </div>
                <div style={{ width: '38%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '11px', fontWeight: 600, color: accent }}>
                        <span>Sub Total</span><span>{formatINR(subtotal)}</span>
                    </div>
                    {fieldVisibility.taxBreakdown !== false && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '11px', color: '#71717a' }}>
                            <span>Tax (GST)</span><span>{formatINR(tax)}</span>
                        </div>
                    )}
                    <div style={{ background: '#3f3f46', color: highlight, display: 'flex', justifyContent: 'space-between', padding: '12px 14px', marginTop: '8px', borderRadius: '4px', fontSize: '14px', fontWeight: 700, border: `1px solid #52525b` }}>
                        <span>Total</span><span>{formatINR(total)}</span>
                    </div>
                    {fieldVisibility.signature !== false && (
                        <div style={{ marginTop: '40px', textAlign: 'right', fontSize: '10px', fontWeight: 600, color: '#71717a' }}>
                            {settings.digitalSignature ? (
                                <img
                                    src={settings.digitalSignature}
                                    alt="Signature"
                                    style={{ maxHeight: '60px', maxWidth: '120px', marginBottom: '5px', display: 'inline-block', filter: 'invert(1) grayscale(100%)' }}
                                />
                            ) : null}
                            <div style={{ borderTop: `1px solid #52525b`, display: 'inline-block', paddingTop: '5px', width: '120px', textAlign: 'center' }}>{authSignLabel}</div>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '2px', background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
        </div>
    );
};

export default CarbonTemplate;
