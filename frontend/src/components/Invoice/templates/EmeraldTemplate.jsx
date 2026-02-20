import React from 'react';
import { formatINR } from '../../../utils/currency';

const gold = '#b8860b';
const lightGreen = '#f0fdf4';

export const EmeraldTemplate = ({ data, settings }) => {
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

    const emerald = brandColor || '#047857';
    // const gold = '#b8860b'; // Keep accent fixed for now or derive
    // const lightGreen = '#f0fdf4';

    const formatDate = (d) => {
        if (!d) return '';
        try { const dt = new Date(d); if (isNaN(dt)) return d; return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`; } catch { return d; }
    };

    const bankLines = bankDetails ? bankDetails.split('\n').filter(Boolean) : null;

    return (
        <div style={{ fontFamily: "'Georgia', 'Times New Roman', serif", width: '100%', height: '100%', background: '#fff', position: 'relative', color: '#333', fontSize: '12px', boxSizing: 'border-box' }}>
            {/* Gold top border */}
            <div style={{ height: '6px', background: `linear-gradient(90deg, ${gold}, ${emerald}, ${gold})` }} />

            {/* Header */}
            <div style={{ padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${emerald}` }}>
                <div>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: emerald, letterSpacing: '1px' }}>{shopName || 'Your Business'}</div>
                    {address && <div style={{ fontSize: '10px', color: '#666', marginTop: '4px', fontStyle: 'italic' }}>{address}</div>}
                    <div style={{ fontSize: '10px', color: '#666' }}>
                        {phone}{phone && email && ' | '}{email}
                    </div>
                    {gstin && <div style={{ fontSize: '10px', color: emerald, fontWeight: 600, marginTop: '2px' }}>GSTIN: {gstin}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: gold, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '4px' }}>Tax Invoice</div>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: emerald, letterSpacing: '2px' }}>INVOICE</div>
                </div>
            </div>

            {/* Details */}
            <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', background: lightGreen }}>
                <div>
                    <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '2px', color: emerald, fontWeight: 700, marginBottom: '6px' }}>Billed To</div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#1a1a1a', fontFamily: 'sans-serif' }}>{customerName}</div>
                    {customerAddress && <div style={{ fontSize: '11px', color: '#555', marginTop: '3px', lineHeight: 1.5, fontFamily: 'sans-serif' }}>{customerAddress}</div>}
                    {customerPhone && <div style={{ fontSize: '11px', color: '#555', fontFamily: 'sans-serif' }}>Tel: {customerPhone}</div>}
                    {customerGstin && <div style={{ fontSize: '11px', color: '#555', fontFamily: 'sans-serif' }}>GSTIN: {customerGstin}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                    <table style={{ fontSize: '11px', fontFamily: 'sans-serif' }}>
                        <tbody>
                            <tr><td style={{ padding: '3px 12px 3px 0', fontWeight: 600, color: emerald }}>Invoice No</td><td style={{ color: '#555' }}>{invoiceNo}</td></tr>
                            <tr><td style={{ padding: '3px 12px 3px 0', fontWeight: 600, color: emerald }}>Date</td><td style={{ color: '#555' }}>{formatDate(date)}</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Table */}
            <div style={{ padding: '0 32px', marginTop: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: 'sans-serif' }}>
                    <thead>
                        <tr style={{ borderTop: `2px solid ${emerald}`, borderBottom: `2px solid ${emerald}` }}>
                            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: emerald, width: '6%' }}>SL</th>
                            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: emerald }}>Item</th>
                            <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: emerald, width: '14%' }}>Price</th>
                            <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: emerald, width: '10%' }}>Qty</th>
                            <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: emerald, width: '18%' }}>Total</th>
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
                        <div style={{ fontWeight: 700, fontSize: '13px', color: emerald, marginBottom: '16px', fontStyle: 'italic' }}>
                            {invoiceFooterText || 'Thank you for your valued business'}
                        </div>
                    )}

                    {fieldVisibility.bankDetails !== false && bankLines && (
                        <div style={{ marginBottom: '16px', fontSize: '10px', fontFamily: 'sans-serif' }}>
                            <div style={{ fontWeight: 700, color: emerald, marginBottom: '6px', fontSize: '11px' }}>Payment Details</div>
                            {bankLines.map((l, i) => <div key={i} style={{ color: '#555', lineHeight: 1.8 }}>{l}</div>)}
                        </div>
                    )}

                    {/* UPI QR Code */}
                    {fieldVisibility.qrCode !== false && settings.qrCode && (
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontWeight: 700, color: emerald, marginBottom: '6px', fontSize: '11px' }}>
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
                        <div style={{ fontSize: '10px', fontFamily: 'sans-serif' }}>
                            <div style={{ fontWeight: 700, color: emerald, marginBottom: '6px', fontSize: '11px' }}>Terms & Conditions</div>
                            <div style={{ color: '#666', lineHeight: 1.5 }}>{terms}</div>
                        </div>
                    )}
                </div>
                <div style={{ width: '38%', fontFamily: 'sans-serif' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '11px', fontWeight: 600 }}>
                        <span>Sub Total</span><span>{formatINR(subtotal)}</span>
                    </div>
                    {fieldVisibility.taxBreakdown !== false && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '11px', color: '#555' }}>
                            <span>GST</span><span>{formatINR(tax)}</span>
                        </div>
                    )}
                    <div style={{ background: emerald, color: '#fff', display: 'flex', justifyContent: 'space-between', padding: '12px 14px', marginTop: '8px', fontSize: '14px', fontWeight: 700 }}>
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
                            <div style={{ borderTop: `2px solid ${emerald}`, display: 'inline-block', paddingTop: '5px', width: '120px', textAlign: 'center' }}>{authSignLabel}</div>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '6px', background: `linear-gradient(90deg, ${gold}, ${emerald}, ${gold})` }} />
        </div>
    );
};

export default EmeraldTemplate;
