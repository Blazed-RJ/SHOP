import React from 'react';
import { formatINR } from '../../../utils/currency';

const darkBg = '#0f172a';
const cardBg = '#1e293b';
const subtle = '#334155';

export const MidnightTemplate = ({ data, settings }) => {
    const {
        invoiceNo = '', date = '', customerName = '', customerPhone = '',
        customerAddress = '', customerGstin = '', items = [],
        subtotal = 0, tax = 0, total = 0, terms = '',
        authSignLabel = 'Authorised Sign',
    } = data || {};

    const {
        shopName = '', address = '', phone = '', email = '',
        gstin = '', bankDetails = '', invoiceFooterText = '',
        fieldVisibility = {}, brandColor
    } = settings || {};

    const accent = brandColor || '#38bdf8';
    // const darkBg = '#0f172a';
    // const cardBg = '#1e293b';

    const formatDate = (d) => {
        if (!d) return '';
        try { const dt = new Date(d); if (isNaN(dt)) return d; return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`; } catch { return d; }
    };

    const bankLines = bankDetails ? bankDetails.split('\n').filter(Boolean) : null;

    return (
        <div style={{ fontFamily: "'Segoe UI', sans-serif", width: '100%', height: '100%', background: darkBg, position: 'relative', color: '#e2e8f0', fontSize: '12px', boxSizing: 'border-box' }}>
            {/* Accent line top */}
            <div style={{ height: '3px', background: `linear-gradient(90deg, ${accent}, #818cf8, #c084fc)` }} />

            {/* Header */}
            <div style={{ padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff', letterSpacing: '1px' }}>{shopName || 'Your Business'}</div>
                    {address && <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>{address}</div>}
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>{phone}{phone && email && ' • '}{email}</div>
                    {gstin && <div style={{ fontSize: '10px', color: accent, fontWeight: 600, marginTop: '2px' }}>GSTIN: {gstin}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '32px', fontWeight: 300, letterSpacing: '4px', color: accent }}>INVOICE</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>#{invoiceNo} • {formatDate(date)}</div>
                </div>
            </div>

            {/* Bill To */}
            <div style={{ padding: '20px 32px', background: cardBg, margin: '0 32px', borderRadius: '8px', marginBottom: '16px' }}>
                <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '2px', color: accent, fontWeight: 700, marginBottom: '8px' }}>Billed To</div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>{customerName}</div>
                {customerAddress && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>{customerAddress}</div>}
                {customerPhone && <div style={{ fontSize: '11px', color: '#94a3b8' }}>Phone: {customerPhone}</div>}
                {customerGstin && <div style={{ fontSize: '11px', color: '#94a3b8' }}>GSTIN: {customerGstin}</div>}
            </div>

            {/* Table */}
            <div style={{ padding: '0 32px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                        <tr>
                            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: accent, borderBottom: `2px solid ${accent}`, width: '6%' }}>#</th>
                            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: accent, borderBottom: `2px solid ${accent}` }}>Description</th>
                            <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: accent, borderBottom: `2px solid ${accent}`, width: '14%' }}>Rate</th>
                            <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: accent, borderBottom: `2px solid ${accent}`, width: '10%' }}>Qty</th>
                            <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: accent, borderBottom: `2px solid ${accent}`, width: '18%' }}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, i) => (
                            <tr key={i} style={{ background: i % 2 === 0 ? cardBg : 'transparent' }}>
                                <td style={{ padding: '10px 12px', borderBottom: `1px solid ${subtle}`, color: '#64748b' }}>{i + 1}</td>
                                <td style={{ padding: '10px 12px', borderBottom: `1px solid ${subtle}`, fontWeight: 600, color: '#fff' }}>{item.name}</td>
                                <td style={{ padding: '10px 12px', borderBottom: `1px solid ${subtle}`, textAlign: 'center', color: '#94a3b8' }}>{formatINR(item.price)}</td>
                                <td style={{ padding: '10px 12px', borderBottom: `1px solid ${subtle}`, textAlign: 'center', color: '#94a3b8' }}>{item.quantity}</td>
                                <td style={{ padding: '10px 12px', borderBottom: `1px solid ${subtle}`, textAlign: 'right', fontWeight: 600, color: '#fff' }}>{formatINR(item.total)}</td>
                            </tr>
                        ))}
                        {items.length === 0 && <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>No items</td></tr>}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '24px 32px', marginTop: '8px' }}>
                <div style={{ width: '55%' }}>
                    {fieldVisibility.footer !== false && (
                        <div style={{ fontWeight: 700, fontSize: '12px', color: accent, marginBottom: '16px' }}>
                            {invoiceFooterText || 'Thank you for your business!'}
                        </div>
                    )}

                    {fieldVisibility.bankDetails !== false && bankLines && (
                        <div style={{ marginBottom: '16px', fontSize: '10px' }}>
                            <div style={{ fontWeight: 700, color: accent, marginBottom: '6px', fontSize: '11px' }}>Payment Info</div>
                            {bankLines.map((l, i) => <div key={i} style={{ color: '#94a3b8', lineHeight: 1.8 }}>{l}</div>)}
                        </div>
                    )}

                    {/* UPI QR Code */}
                    {fieldVisibility.qrCode !== false && settings.qrCode && (
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontWeight: 700, color: accent, marginBottom: '6px', fontSize: '11px' }}>
                                {fieldVisibility.qrText !== false ? 'Scan to Pay' : ''}
                            </div>
                            <img src={settings.qrCode} alt="UPI QR" style={{ width: '80px', height: '80px', filter: 'invert(1)' }} />
                        </div>
                    )}

                    {fieldVisibility.terms !== false && terms && (
                        <div style={{ fontSize: '10px' }}>
                            <div style={{ fontWeight: 700, color: accent, marginBottom: '6px', fontSize: '11px' }}>Terms & Conditions</div>
                            <div style={{ color: '#94a3b8', lineHeight: 1.5 }}>{terms}</div>
                        </div>
                    )}
                </div>
                <div style={{ width: '38%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '11px', fontWeight: 600, color: '#cbd5e1' }}>
                        <span>Sub Total</span><span>{formatINR(subtotal)}</span>
                    </div>
                    {fieldVisibility.taxBreakdown !== false && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '11px', color: '#94a3b8' }}>
                            <span>Tax (GST)</span><span>{formatINR(tax)}</span>
                        </div>
                    )}
                    <div style={{ background: `linear-gradient(135deg, ${accent}, #818cf8)`, color: darkBg, display: 'flex', justifyContent: 'space-between', padding: '12px 14px', marginTop: '8px', borderRadius: '8px', fontSize: '14px', fontWeight: 700 }}>
                        <span>Total</span><span>{formatINR(total)}</span>
                    </div>
                    {fieldVisibility.signature !== false && (
                        <div style={{ marginTop: '40px', textAlign: 'right', fontSize: '10px', fontWeight: 600, color: '#94a3b8' }}>
                            {settings.digitalSignature ? (
                                <img
                                    src={settings.digitalSignature}
                                    alt="Signature"
                                    style={{ maxHeight: '60px', maxWidth: '120px', marginBottom: '5px', display: 'inline-block', filter: 'invert(1)' }}
                                />
                            ) : null}
                            <div style={{ borderTop: `1px solid ${accent}`, display: 'inline-block', paddingTop: '5px', width: '120px', textAlign: 'center' }}>{authSignLabel}</div>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '3px', background: `linear-gradient(90deg, ${accent}, #818cf8, #c084fc)` }} />
        </div>
    );
};

export default MidnightTemplate;
