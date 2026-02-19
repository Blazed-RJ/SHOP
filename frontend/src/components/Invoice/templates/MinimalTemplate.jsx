import React from 'react';
import { formatINR } from '../../../utils/currency';

export const MinimalTemplate = ({ data, settings }) => {
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

    const primary = brandColor || '#111';
    const text = primaryTextColor || '#333';

    const formatDate = (d) => {
        if (!d) return '';
        try { const dt = new Date(d); if (isNaN(dt)) return d; return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`; } catch { return d; }
    };

    const bankLines = bankDetails ? bankDetails.split('\n').filter(Boolean) : null;

    return (
        <div style={{ fontFamily: "'Segoe UI', 'Helvetica', sans-serif", width: '100%', height: '100%', background: '#fff', position: 'relative', color: text, fontSize: '12px', boxSizing: 'border-box', padding: '32px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', paddingBottom: '20px', borderBottom: '1px solid #e0e0e0' }}>
                <div>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: primary, letterSpacing: '0.5px' }}>{shopName || 'Your Business'}</div>
                    {address && <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>{address}</div>}
                    <div style={{ fontSize: '10px', color: '#999' }}>{phone}{phone && email && ' • '}{email}</div>
                    {gstin && <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>GSTIN: {gstin}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '28px', fontWeight: 200, letterSpacing: '4px', color: primary }}>INVOICE</div>
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>#{invoiceNo}</div>
                    <div style={{ fontSize: '11px', color: '#999' }}>{formatDate(date)}</div>
                </div>
            </div>

            {/* Bill To */}
            <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '2px', color: '#aaa', fontWeight: 600, marginBottom: '6px' }}>Bill To</div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: primary }}>{customerName}</div>
                {customerAddress && <div style={{ fontSize: '11px', color: '#777', marginTop: '3px' }}>{customerAddress}</div>}
                {customerPhone && <div style={{ fontSize: '11px', color: '#777' }}>{customerPhone}</div>}
                {customerGstin && <div style={{ fontSize: '11px', color: '#777' }}>GSTIN: {customerGstin}</div>}
            </div>

            {/* Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '24px' }}>
                <thead>
                    <tr style={{ borderBottom: `2px solid ${primary}` }}>
                        <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 600, color: primary, width: '6%' }}>#</th>
                        <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 600, color: primary }}>Item</th>
                        <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 600, color: primary, width: '14%' }}>Rate</th>
                        <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 600, color: primary, width: '10%' }}>Qty</th>
                        <th style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 600, color: primary, width: '18%' }}>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, i) => (
                        <tr key={i}>
                            <td style={{ padding: '10px 8px', borderBottom: '1px solid #eee', color: '#aaa' }}>{i + 1}</td>
                            <td style={{ padding: '10px 8px', borderBottom: '1px solid #eee', fontWeight: 500, color: text }}>{item.name}</td>
                            <td style={{ padding: '10px 8px', borderBottom: '1px solid #eee', textAlign: 'center', color: '#666' }}>{formatINR(item.price)}</td>
                            <td style={{ padding: '10px 8px', borderBottom: '1px solid #eee', textAlign: 'center', color: '#666' }}>{item.quantity}</td>
                            <td style={{ padding: '10px 8px', borderBottom: '1px solid #eee', textAlign: 'right', fontWeight: 600 }}>{formatINR(item.total)}</td>
                        </tr>
                    ))}
                    {items.length === 0 && <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#ccc' }}>No items</td></tr>}
                </tbody>
            </table>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ width: '55%' }}>
                    {fieldVisibility.footer !== false && (
                        <div style={{ fontWeight: 600, fontSize: '11px', color: primary, marginBottom: '16px' }}>
                            {invoiceFooterText || 'Thank you.'}
                        </div>
                    )}

                    {fieldVisibility.bankDetails !== false && bankLines && (
                        <div style={{ marginBottom: '16px', fontSize: '10px' }}>
                            <div style={{ fontWeight: 600, color: primary, marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase' }}>Payment</div>
                            {bankLines.map((l, i) => <div key={i} style={{ color: '#555', lineHeight: 1.6 }}>{l}</div>)}
                        </div>
                    )}

                    {/* UPI QR Code */}
                    {fieldVisibility.qrCode !== false && settings.qrCode && (
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontWeight: 600, color: primary, marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase' }}>
                                {fieldVisibility.qrText !== false ? 'Scan' : ''}
                            </div>
                            <img src={settings.qrCode} alt="UPI QR" style={{ width: '80px', height: '80px' }} />
                        </div>
                    )}

                    {fieldVisibility.terms !== false && terms && (
                        <div style={{ fontSize: '10px' }}>
                            <div style={{ fontWeight: 600, color: primary, marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase' }}>Terms</div>
                            <div style={{ color: '#555', lineHeight: 1.4 }}>{terms}</div>
                        </div>
                    )}
                </div>
                <div style={{ width: '35%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '11px' }}>
                        <span style={{ color: '#999' }}>Subtotal</span><span style={{ fontWeight: 600 }}>{formatINR(subtotal)}</span>
                    </div>
                    {fieldVisibility.taxBreakdown !== false && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '11px' }}>
                            <span style={{ color: '#999' }}>Tax</span><span style={{ fontWeight: 600, color: '#555' }}>{formatINR(tax)}</span>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '16px', fontWeight: 700, borderTop: `2px solid ${primary}`, marginTop: '6px', color: primary }}>
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
                            <div style={{ borderTop: `1px solid ${primary}`, display: 'inline-block', paddingTop: '5px', width: '120px', textAlign: 'center' }}>{authSignLabel}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MinimalTemplate;
