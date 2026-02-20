import React from 'react';
import { formatINR } from '../../../utils/currency';



export const NeonTemplate = ({ data, settings }) => {
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

    const neonPink = brandColor || '#ff007a';
    const neonBlue = brandColor ? `${brandColor}aa` : '#00d4ff';
    const neonPurple = '#a855f7';
    const darkBg = '#0a0a0f';
    const cardBg = '#14141f'; // Use primaryTextColor for secondary neon

    const formatDate = (d) => {
        if (!d) return '';
        try { const dt = new Date(d); if (isNaN(dt)) return d; return `${String(dt.getDate()).padStart(2, '0')}.${String(dt.getMonth() + 1).padStart(2, '0')}.${dt.getFullYear()}`; } catch { return d; }
    };

    const bankLines = bankDetails ? bankDetails.split('\n').filter(Boolean) : null;

    return (
        <div style={{ fontFamily: "'Segoe UI', 'Consolas', monospace", width: '100%', height: '100%', background: darkBg, position: 'relative', color: '#ddd', fontSize: '12px', boxSizing: 'border-box' }}>
            {/* Neon gradient top */}
            <div style={{ height: '3px', background: `linear-gradient(90deg, ${neonBlue}, ${neonPurple}, ${neonPink})` }} />

            {/* Header */}
            <div style={{ padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid #222` }}>
                <div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: neonBlue, letterSpacing: '2px', textTransform: 'uppercase', textShadow: `0 0 10px ${neonBlue}40` }}>{shopName || 'Your Business'}</div>
                    {address && <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>{address}</div>}
                    <div style={{ fontSize: '10px', color: '#666' }}>{phone}{phone && email && ' | '}{email}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '30px', fontWeight: 700, letterSpacing: '6px', background: `linear-gradient(90deg, ${neonBlue}, ${neonPurple}, ${neonPink})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>INVOICE</div>
                    <div style={{ fontSize: '10px', color: neonPink, marginTop: '4px', fontFamily: 'monospace' }}>#{invoiceNo}</div>
                </div>
            </div>

            {/* Details */}
            <div style={{ padding: '20px 32px', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ background: cardBg, padding: '16px', borderRadius: '8px', border: `1px solid #222`, flex: 1, marginRight: '16px' }}>
                    <div style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '3px', color: neonPink, fontWeight: 700, marginBottom: '8px' }}>[ BILL TO ]</div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#fff' }}>{customerName}</div>
                    {customerAddress && <div style={{ fontSize: '10px', color: '#888', marginTop: '3px' }}>{customerAddress}</div>}
                    {customerPhone && <div style={{ fontSize: '10px', color: '#888' }}>{customerPhone}</div>}
                    {customerGstin && <div style={{ fontSize: '10px', color: neonBlue }}>GSTIN: {customerGstin}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                    <table style={{ fontSize: '10px', fontFamily: 'monospace' }}>
                        <tbody>
                            <tr><td style={{ padding: '3px 10px', color: neonPurple, fontWeight: 600 }}>DATE</td><td style={{ color: '#888' }}>{formatDate(date)}</td></tr>
                            {gstin && <tr><td style={{ padding: '3px 10px', color: neonPurple, fontWeight: 600 }}>GSTIN</td><td style={{ color: '#888' }}>{gstin}</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Table */}
            <div style={{ padding: '0 32px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                        <tr>
                            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: neonBlue, borderBottom: `2px solid ${neonPurple}`, width: '6%', fontFamily: 'monospace', fontSize: '10px' }}>#</th>
                            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: neonBlue, borderBottom: `2px solid ${neonPurple}`, fontFamily: 'monospace', fontSize: '10px' }}>ITEM</th>
                            <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: neonBlue, borderBottom: `2px solid ${neonPurple}`, width: '14%', fontFamily: 'monospace', fontSize: '10px' }}>RATE</th>
                            <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: neonBlue, borderBottom: `2px solid ${neonPurple}`, width: '10%', fontFamily: 'monospace', fontSize: '10px' }}>QTY</th>
                            <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: neonBlue, borderBottom: `2px solid ${neonPurple}`, width: '18%', fontFamily: 'monospace', fontSize: '10px' }}>TOTAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, i) => (
                            <tr key={i} style={{ background: i % 2 === 0 ? cardBg : 'transparent' }}>
                                <td style={{ padding: '10px 12px', borderBottom: '1px solid #1a1a2e', color: '#555', fontFamily: 'monospace' }}>{String(i + 1).padStart(2, '0')}</td>
                                <td style={{ padding: '10px 12px', borderBottom: '1px solid #1a1a2e', fontWeight: 600, color: '#e0e0e0' }}>{item.name}</td>
                                <td style={{ padding: '10px 12px', borderBottom: '1px solid #1a1a2e', textAlign: 'center', color: '#888' }}>{formatINR(item.price)}</td>
                                <td style={{ padding: '10px 12px', borderBottom: '1px solid #1a1a2e', textAlign: 'center', color: '#888' }}>{item.quantity}</td>
                                <td style={{ padding: '10px 12px', borderBottom: '1px solid #1a1a2e', textAlign: 'right', fontWeight: 600, color: neonPink }}>{formatINR(item.total)}</td>
                            </tr>
                        ))}
                        {items.length === 0 && <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#555', fontStyle: 'italic' }}>No items</td></tr>}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '24px 32px', marginTop: '8px' }}>
                <div style={{ width: '55%' }}>
                    {fieldVisibility.footer !== false && (
                        <div style={{ fontWeight: 700, fontSize: '11px', color: neonPink, marginBottom: '16px' }}>
                            {invoiceFooterText || '// Thank you for your business'}
                        </div>
                    )}

                    {fieldVisibility.bankDetails !== false && bankLines && (
                        <div style={{ marginBottom: '16px', fontSize: '10px' }}>
                            <div style={{ fontWeight: 700, color: neonBlue, marginBottom: '6px', fontSize: '10px', fontFamily: 'monospace', letterSpacing: '2px' }}>[ PAYMENT ]</div>
                            {bankLines.map((l, i) => <div key={i} style={{ color: '#888', lineHeight: 1.8 }}>{l}</div>)}
                        </div>
                    )}

                    {/* UPI QR Code */}
                    {fieldVisibility.qrCode !== false && settings.qrCode && (
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontWeight: 700, color: neonBlue, marginBottom: '6px', fontSize: '10px', fontFamily: 'monospace', letterSpacing: '2px' }}>
                                {fieldVisibility.qrCode ? '[ SCAN TO PAY ]' : ''}
                            </div>
                            <img src={settings.qrCode} alt="UPI QR" style={{ width: '80px', height: '80px', filter: 'invert(1)' }} />
                            {fieldVisibility.qrText !== false && (settings.upiId || data?.upiId) && (
                                <div style={{ fontSize: '9px', marginTop: '4px', color: '#888', fontWeight: 500, wordBreak: 'break-all', maxWidth: '120px' }}>
                                    {settings.upiId || data?.upiId}
                                </div>
                            )}
                            {fieldVisibility.qrText !== false && settings.upiId && (
                                <div style={{ fontSize: '9px', color: '#aaa', marginTop: '4px', fontFamily: 'monospace' }}>
                                    {settings.upiId}
                                </div>
                            )}
                        </div>
                    )}

                    {fieldVisibility.terms !== false && terms && (
                        <div style={{ fontSize: '10px' }}>
                            <div style={{ fontWeight: 700, color: neonBlue, marginBottom: '6px', fontSize: '10px', fontFamily: 'monospace', letterSpacing: '2px' }}>[ TERMS ]</div>
                            <div style={{ color: '#888', lineHeight: 1.5 }}>{terms}</div>
                        </div>
                    )}
                </div>
                <div style={{ width: '38%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '11px', fontWeight: 600, color: '#aaa' }}>
                        <span>Sub Total</span><span>{formatINR(subtotal)}</span>
                    </div>
                    {fieldVisibility.taxBreakdown !== false && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '11px', color: '#666' }}>
                            <span>Tax (GST)</span><span>{formatINR(tax)}</span>
                        </div>
                    )}
                    <div style={{ background: `linear-gradient(90deg, ${neonBlue}, ${neonPurple}, ${neonPink})`, color: '#fff', display: 'flex', justifyContent: 'space-between', padding: '12px 14px', marginTop: '8px', borderRadius: '6px', fontSize: '14px', fontWeight: 700 }}>
                        <span>TOTAL</span><span>{formatINR(total)}</span>
                    </div>
                    {fieldVisibility.signature !== false && (
                        <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            {settings.digitalSignature ? (
                                <img
                                    src={settings.digitalSignature}
                                    alt="Signature"
                                    style={{ height: '50px', width: 'auto', marginBottom: '8px', filter: 'invert(1)', objectFit: 'contain' }}
                                />
                            ) : (
                                <div style={{ height: '50px' }}></div>
                            )}
                            <div style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                color: '#666',
                                borderTop: `1px solid ${neonPurple}`,
                                paddingTop: '6px',
                                paddingLeft: '20px',
                                paddingRight: '20px',
                                textAlign: 'center',
                                minWidth: '140px'
                            }}>
                                {authSignLabel}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '3px', background: `linear-gradient(90deg, ${neonBlue}, ${neonPurple}, ${neonPink})` }} />
        </div>
    );
};

export default NeonTemplate;
