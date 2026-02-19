import React from 'react';
import { formatINR } from '../../../utils/currency';



export const EarthTemplate = ({ data, settings }) => {
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

    const brown = brandColor || '#78350f';
    const tan = primaryTextColor || '#92400e';
    const beige = '#fef3c7'; // Using primaryTextColor for secondary earth tone might be risky, but consistent logic.
    // const beige = '#fef3c7';

    const formatDate = (d) => {
        if (!d) return '';
        try { const dt = new Date(d); if (isNaN(dt)) return d; return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`; } catch { return d; }
    };

    const bankLines = bankDetails ? bankDetails.split('\n').filter(Boolean) : null;

    return (
        <div style={{ fontFamily: "'Segoe UI', sans-serif", width: '100%', height: '100%', background: '#fffdf7', position: 'relative', color: '#333', fontSize: '12px', boxSizing: 'border-box' }}>
            {/* Header */}
            <div style={{ background: brown, color: '#fff', padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '1px' }}>{shopName || 'Your Business'}</div>
                    {address && <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '4px' }}>{address}</div>}
                    <div style={{ fontSize: '10px', opacity: 0.8 }}>{phone}{phone && email && ' • '}{email}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '34px', fontWeight: 300, letterSpacing: '4px' }}>INVOICE</div>
                </div>
            </div>

            {/* Earth accent */}
            <div style={{ height: '4px', background: `linear-gradient(90deg, #78350f, #d97706, #92400e)` }} />

            {/* Details */}
            <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', background: beige }}>
                <div>
                    <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '2px', color: brown, fontWeight: 700, marginBottom: '6px' }}>Bill To</div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#1a1a1a' }}>{customerName}</div>
                    {customerAddress && <div style={{ fontSize: '11px', color: '#666', marginTop: '3px' }}>{customerAddress}</div>}
                    {customerPhone && <div style={{ fontSize: '11px', color: '#666' }}>{customerPhone}</div>}
                    {customerGstin && <div style={{ fontSize: '11px', color: '#666' }}>GSTIN: {customerGstin}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                    <table style={{ fontSize: '11px' }}>
                        <tbody>
                            <tr><td style={{ padding: '3px 10px', fontWeight: 600, color: brown }}>Invoice#</td><td style={{ color: '#555' }}>{invoiceNo}</td></tr>
                            <tr><td style={{ padding: '3px 10px', fontWeight: 600, color: brown }}>Date</td><td style={{ color: '#555' }}>{formatDate(date)}</td></tr>
                            {gstin && <tr><td style={{ padding: '3px 10px', fontWeight: 600, color: brown }}>GSTIN</td><td style={{ color: '#555' }}>{gstin}</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Table */}
            <div style={{ padding: '16px 32px 0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                        <tr>
                            <th style={{ background: tan, color: '#fff', padding: '10px 12px', textAlign: 'left', fontWeight: 600, width: '6%' }}>#</th>
                            <th style={{ background: tan, color: '#fff', padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Item</th>
                            <th style={{ background: tan, color: '#fff', padding: '10px 12px', textAlign: 'center', fontWeight: 600, width: '14%' }}>Price</th>
                            <th style={{ background: tan, color: '#fff', padding: '10px 12px', textAlign: 'center', fontWeight: 600, width: '10%' }}>Qty</th>
                            <th style={{ background: tan, color: '#fff', padding: '10px 12px', textAlign: 'right', fontWeight: 600, width: '18%' }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, i) => (
                            <tr key={i} style={{ background: i % 2 === 0 ? beige : '#fffdf7' }}>
                                <td style={{ padding: '10px 12px', borderBottom: '1px solid #e5d5a0', color: '#888' }}>{i + 1}</td>
                                <td style={{ padding: '10px 12px', borderBottom: '1px solid #e5d5a0', fontWeight: 600, color: '#333' }}>{item.name}</td>
                                <td style={{ padding: '10px 12px', borderBottom: '1px solid #e5d5a0', textAlign: 'center', color: '#555' }}>{formatINR(item.price)}</td>
                                <td style={{ padding: '10px 12px', borderBottom: '1px solid #e5d5a0', textAlign: 'center', color: '#555' }}>{item.quantity}</td>
                                <td style={{ padding: '10px 12px', borderBottom: '1px solid #e5d5a0', textAlign: 'right', fontWeight: 600 }}>{formatINR(item.total)}</td>
                            </tr>
                        ))}
                        {items.length === 0 && <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#999', fontStyle: 'italic' }}>No items</td></tr>}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '24px 32px', marginTop: '8px' }}>
                <div style={{ width: '55%' }}>
                    {fieldVisibility.footer !== false && (
                        <div style={{ fontWeight: 700, fontSize: '12px', color: brown, marginBottom: '16px' }}>
                            {invoiceFooterText || 'Thank you for your patronage!'}
                        </div>
                    )}

                    {fieldVisibility.bankDetails !== false && bankLines && (
                        <div style={{ marginBottom: '16px', fontSize: '10px' }}>
                            <div style={{ fontWeight: 700, color: tan, marginBottom: '6px', fontSize: '11px' }}>Payment Info</div>
                            {bankLines.map((l, i) => <div key={i} style={{ color: '#555', lineHeight: 1.8 }}>{l}</div>)}
                        </div>
                    )}

                    {/* UPI QR Code */}
                    {fieldVisibility.qrCode !== false && settings.qrCode && (
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontWeight: 700, color: tan, marginBottom: '6px', fontSize: '11px' }}>
                                {fieldVisibility.qrText !== false ? 'Scan to Pay' : ''}
                            </div>
                            <img src={settings.qrCode} alt="UPI QR" style={{ width: '80px', height: '80px' }} />
                        </div>
                    )}

                    {fieldVisibility.terms !== false && terms && (
                        <div style={{ fontSize: '10px' }}>
                            <div style={{ fontWeight: 700, color: tan, marginBottom: '6px', fontSize: '11px' }}>Terms</div>
                            <div style={{ color: '#666', lineHeight: 1.5 }}>{terms}</div>
                        </div>
                    )}
                </div>
                <div style={{ width: '38%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '11px', fontWeight: 600 }}>
                        <span>Sub Total</span><span>{formatINR(subtotal)}</span>
                    </div>
                    {fieldVisibility.taxBreakdown !== false && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '11px', color: '#555' }}>
                            <span>Tax (GST)</span><span>{formatINR(tax)}</span>
                        </div>
                    )}
                    <div style={{ background: brown, color: '#fff', display: 'flex', justifyContent: 'space-between', padding: '12px 14px', marginTop: '8px', fontSize: '14px', fontWeight: 700 }}>
                        <span>Total</span><span>{formatINR(total)}</span>
                    </div>
                    {fieldVisibility.signature !== false && (
                        <div style={{ marginTop: '40px', textAlign: 'right', fontSize: '10px', fontWeight: 600 }}>
                            {settings.digitalSignature ? (
                                <img
                                    src={settings.digitalSignature}
                                    alt="Signature"
                                    style={{ maxHeight: '60px', maxWidth: '120px', marginBottom: '5px', display: 'inline-block' }}
                                />
                            ) : null}
                            <div style={{ borderTop: `2px solid ${brown}`, display: 'inline-block', paddingTop: '5px', width: '120px', textAlign: 'center' }}>{authSignLabel}</div>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '4px', background: `linear-gradient(90deg, #78350f, #d97706, #92400e)` }} />
        </div>
    );
};

export default EarthTemplate;
