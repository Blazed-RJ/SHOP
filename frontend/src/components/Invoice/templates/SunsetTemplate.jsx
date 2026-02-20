import React from 'react';
import { formatINR } from '../../../utils/currency';

const coral = '#f97316';
const warmBg = '#fff7ed';

export const SunsetTemplate = ({ data, settings }) => {
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

    const sunset = brandColor || '#e8590c';
    // const coral = '#f97316'; 
    // const warmBg = '#fff7ed';

    const formatDate = (d) => {
        if (!d) return '';
        try { const dt = new Date(d); if (isNaN(dt)) return d; return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`; } catch { return d; }
    };

    const bankLines = bankDetails ? bankDetails.split('\n').filter(Boolean) : null;

    return (
        <div style={{ fontFamily: "'Segoe UI', sans-serif", width: '100%', height: '100%', background: '#fff', position: 'relative', color: '#333', fontSize: '12px', boxSizing: 'border-box' }}>
            {/* Header with warm gradient */}
            <div style={{ background: `linear-gradient(135deg, ${sunset} 0%, ${coral} 50%, #fbbf24 100%)`, color: '#fff', padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '1px' }}>{shopName || 'Your Business'}</div>
                    {address && <div style={{ fontSize: '10px', opacity: 0.85, marginTop: '4px' }}>{address}</div>}
                    <div style={{ fontSize: '10px', opacity: 0.85 }}>{phone}{phone && email && ' • '}{email}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '34px', fontWeight: 300, letterSpacing: '4px' }}>INVOICE</div>
                </div>
            </div>

            {/* Invoice details bar */}
            <div style={{ background: warmBg, padding: '16px 32px', display: 'flex', justifyContent: 'space-between', borderBottom: `2px solid #fed7aa` }}>
                <div style={{ display: 'flex', gap: '32px', fontSize: '11px' }}>
                    <div><span style={{ fontWeight: 700, color: sunset }}>Invoice#:</span> {invoiceNo}</div>
                    <div><span style={{ fontWeight: 700, color: sunset }}>Date:</span> {formatDate(date)}</div>
                    {gstin && <div><span style={{ fontWeight: 700, color: sunset }}>GSTIN:</span> {gstin}</div>}
                </div>
            </div>

            {/* Bill To */}
            <div style={{ padding: '20px 32px' }}>
                <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '2px', color: coral, fontWeight: 700, marginBottom: '6px' }}>Bill To</div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#1a1a1a' }}>{customerName}</div>
                {customerAddress && <div style={{ fontSize: '11px', color: '#666', marginTop: '3px' }}>{customerAddress}</div>}
                {customerPhone && <div style={{ fontSize: '11px', color: '#666' }}>{customerPhone}</div>}
                {customerGstin && <div style={{ fontSize: '11px', color: '#666' }}>GSTIN: {customerGstin}</div>}
            </div>

            {/* Table */}
            <div style={{ padding: '0 32px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                        <tr>
                            <th style={{ background: sunset, color: '#fff', padding: '10px 12px', textAlign: 'left', fontWeight: 600, width: '6%' }}>#</th>
                            <th style={{ background: sunset, color: '#fff', padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Item Description</th>
                            <th style={{ background: sunset, color: '#fff', padding: '10px 12px', textAlign: 'center', fontWeight: 600, width: '14%' }}>Rate</th>
                            <th style={{ background: sunset, color: '#fff', padding: '10px 12px', textAlign: 'center', fontWeight: 600, width: '10%' }}>Qty</th>
                            <th style={{ background: sunset, color: '#fff', padding: '10px 12px', textAlign: 'right', fontWeight: 600, width: '18%' }}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, i) => (
                            <tr key={i} style={{ background: i % 2 === 0 ? warmBg : '#fff' }}>
                                <td style={{ padding: '10px 12px', borderBottom: '1px solid #fde4c8', color: '#888' }}>{i + 1}</td>
                                <td style={{ padding: '10px 12px', borderBottom: '1px solid #fde4c8', fontWeight: 600, color: '#333' }}>{item.name}</td>
                                <td style={{ padding: '10px 12px', borderBottom: '1px solid #fde4c8', textAlign: 'center', color: '#555' }}>{formatINR(item.price)}</td>
                                <td style={{ padding: '10px 12px', borderBottom: '1px solid #fde4c8', textAlign: 'center', color: '#555' }}>{item.quantity}</td>
                                <td style={{ padding: '10px 12px', borderBottom: '1px solid #fde4c8', textAlign: 'right', fontWeight: 600 }}>{formatINR(item.total)}</td>
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
                        <div style={{ fontWeight: 700, fontSize: '12px', color: sunset, marginBottom: '16px' }}>
                            {invoiceFooterText || 'Thank you for your business!'}
                        </div>
                    )}

                    {fieldVisibility.bankDetails !== false && bankLines && (
                        <div style={{ marginBottom: '16px', fontSize: '10px' }}>
                            <div style={{ fontWeight: 700, color: coral, marginBottom: '6px', fontSize: '11px' }}>Payment Info</div>
                            {bankLines.map((l, i) => <div key={i} style={{ color: '#555', lineHeight: 1.8 }}>{l}</div>)}
                        </div>
                    )}

                    {/* UPI QR Code */}
                    {fieldVisibility.qrCode !== false && settings.qrCode && (
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontWeight: 700, color: coral, marginBottom: '6px', fontSize: '11px' }}>
                                {fieldVisibility.qrText !== false ? 'Scan to Pay' : ''}
                            </div>
                            <img src={settings.qrCode} alt="UPI QR" style={{ width: '80px', height: '80px' }} />
                            {fieldVisibility.qrText !== false && (settings.upiId || data?.upiId) && (
                                <div style={{ fontSize: '9px', marginTop: '4px', color: '#888', fontWeight: 500, wordBreak: 'break-all', maxWidth: '120px' }}>
                                    {settings.upiId || data?.upiId}
                                </div>
                            )}
                        </div>
                    )}

                    {fieldVisibility.terms !== false && terms && (
                        <div style={{ fontSize: '10px' }}>
                            <div style={{ fontWeight: 700, color: coral, marginBottom: '6px', fontSize: '11px' }}>Terms & Conditions</div>
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
                    <div style={{ background: `linear-gradient(135deg, ${sunset}, ${coral})`, color: '#fff', display: 'flex', justifyContent: 'space-between', padding: '12px 14px', marginTop: '8px', borderRadius: '8px', fontSize: '14px', fontWeight: 700 }}>
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
                            <div style={{ borderTop: `2px solid ${sunset}`, display: 'inline-block', paddingTop: '5px', width: '120px', textAlign: 'center' }}>{authSignLabel}</div>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '5px', background: `linear-gradient(90deg, ${sunset}, ${coral}, #fbbf24)` }} />
        </div>
    );
};

export default SunsetTemplate;
