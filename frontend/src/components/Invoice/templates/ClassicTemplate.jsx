import React from 'react';
import { formatINR } from '../../../utils/currency';



export const ClassicTemplate = ({ data, settings }) => {
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

    const navy = brandColor || '#1a1a2e';
    const serifColor = primaryTextColor || '#2d2d3f';

    const formatDate = (d) => {
        if (!d) return '';
        try { const dt = new Date(d); if (isNaN(dt)) return d; const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']; return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`; } catch { return d; }
    };

    const bankLines = bankDetails ? bankDetails.split('\n').filter(Boolean) : null;

    return (
        <div style={{ fontFamily: "'Georgia', 'Times New Roman', serif", width: '100%', height: '100%', background: '#fff', position: 'relative', color: '#333', fontSize: '12px', boxSizing: 'border-box' }}>
            {/* Double border top */}
            <div style={{ height: '2px', background: navy }} />
            <div style={{ height: '1px', background: '#fff' }} />
            <div style={{ height: '1px', background: navy }} />

            {/* Header */}
            <div style={{ padding: '32px 32px 20px', textAlign: 'center', borderBottom: `1px solid #e0e0e0` }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: serifColor, letterSpacing: '3px', textTransform: 'uppercase' }}>{shopName || 'Your Business'}</div>
                <div style={{ fontSize: '10px', color: '#888', marginTop: '4px', letterSpacing: '1px' }}>
                    {address}{address && (phone || email) ? ' • ' : ''}{phone}{phone && email ? ' • ' : ''}{email}
                </div>
                {gstin && <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>GSTIN: {gstin}</div>}
                <div style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '6px', textTransform: 'uppercase', color: navy, marginTop: '16px', borderTop: `1px solid #ddd`, borderBottom: `1px solid #ddd`, padding: '8px 0', display: 'inline-block', paddingLeft: '20px', paddingRight: '20px' }}>INVOICE</div>
            </div>

            {/* Details */}
            <div style={{ padding: '20px 32px', display: 'flex', justifyContent: 'space-between', fontFamily: "'Segoe UI', sans-serif" }}>
                <div>
                    <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '2px', color: '#888', fontWeight: 700, marginBottom: '6px' }}>Bill To</div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#1a1a1a' }}>{customerName}</div>
                    {customerAddress && <div style={{ fontSize: '11px', color: '#666', marginTop: '3px', lineHeight: 1.5 }}>{customerAddress}</div>}
                    {customerPhone && <div style={{ fontSize: '11px', color: '#666' }}>Tel: {customerPhone}</div>}
                    {customerGstin && <div style={{ fontSize: '11px', color: '#666' }}>GSTIN: {customerGstin}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                    <table style={{ fontSize: '11px' }}>
                        <tbody>
                            <tr><td style={{ padding: '3px 12px', fontWeight: 600, color: serifColor }}>Invoice No.</td><td>{invoiceNo}</td></tr>
                            <tr><td style={{ padding: '3px 12px', fontWeight: 600, color: serifColor }}>Date</td><td>{formatDate(date)}</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Table */}
            <div style={{ padding: '0 32px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: "'Segoe UI', sans-serif" }}>
                    <thead>
                        <tr style={{ borderTop: `2px solid ${navy}`, borderBottom: `2px solid ${navy}` }}>
                            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: navy, width: '6%' }}>No.</th>
                            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: navy }}>Particular</th>
                            <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: navy, width: '14%' }}>Rate</th>
                            <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: navy, width: '10%' }}>Qty</th>
                            <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: navy, width: '18%' }}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, i) => (
                            <tr key={i}>
                                <td style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', color: '#888' }}>{i + 1}</td>
                                <td style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#1a1a1a' }}>{item.name}</td>
                                <td style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', textAlign: 'center', color: '#555' }}>{formatINR(item.price)}</td>
                                <td style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', textAlign: 'center', color: '#555' }}>{item.quantity}</td>
                                <td style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', textAlign: 'right', fontWeight: 600 }}>{formatINR(item.total)}</td>
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
                        <div style={{ fontWeight: 700, fontSize: '13px', color: serifColor, marginBottom: '16px', fontStyle: 'italic' }}>
                            {invoiceFooterText || 'With our compliments'}
                        </div>
                    )}

                    {fieldVisibility.bankDetails !== false && bankLines && (
                        <div style={{ marginBottom: '16px', fontSize: '10px', fontFamily: "'Segoe UI', sans-serif" }}>
                            <div style={{ fontWeight: 700, color: navy, marginBottom: '6px', fontSize: '11px' }}>Payment Details</div>
                            {bankLines.map((l, i) => <div key={i} style={{ color: '#555', lineHeight: 1.8 }}>{l}</div>)}
                        </div>
                    )}

                    {/* UPI QR Code */}
                    {fieldVisibility.qrCode !== false && settings.qrCode && (
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontWeight: 700, color: navy, marginBottom: '6px', fontSize: '11px' }}>
                                {fieldVisibility.qrText !== false ? 'Scan to Pay' : ''}
                            </div>
                            <img src={settings.qrCode} alt="UPI QR" style={{ width: '80px', height: '80px' }} />
                        </div>
                    )}

                    {fieldVisibility.terms !== false && terms && (
                        <div style={{ fontSize: '10px', fontFamily: "'Segoe UI', sans-serif" }}>
                            <div style={{ fontWeight: 700, color: navy, marginBottom: '6px', fontSize: '11px' }}>Terms & Conditions</div>
                            <div style={{ color: '#666', lineHeight: 1.5 }}>{terms}</div>
                        </div>
                    )}
                </div>
                <div style={{ width: '38%', fontFamily: "'Segoe UI', sans-serif" }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '11px', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>
                        <span>Sub Total</span><span>{formatINR(subtotal)}</span>
                    </div>
                    {fieldVisibility.taxBreakdown !== false && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '11px', color: '#555', borderBottom: '1px solid #e5e7eb' }}>
                            <span>Tax (GST)</span><span>{formatINR(tax)}</span>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '14px', fontWeight: 700, color: navy, borderTop: `2px solid ${navy}`, borderBottom: `2px solid ${navy}`, marginTop: '6px' }}>
                        <span>Total Due</span><span>{formatINR(total)}</span>
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
                            <div style={{ borderTop: `1px solid ${navy}`, display: 'inline-block', paddingTop: '5px', width: '120px', textAlign: 'center' }}>{authSignLabel}</div>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ height: '2px', background: navy, position: 'absolute', bottom: '3px', left: 0, width: '100%' }} />
            <div style={{ height: '1px', background: navy, position: 'absolute', bottom: 0, left: 0, width: '100%' }} />
        </div>
    );
};

export default ClassicTemplate;
